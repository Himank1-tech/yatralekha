import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

// Neon Object Storage / AWS S3 Environment Configuration
const NEON_STORAGE_ENDPOINT = process.env.NEON_STORAGE_ENDPOINT || process.env.AWS_ENDPOINT_URL_S3 || process.env.S3_ENDPOINT;
const NEON_STORAGE_REGION = process.env.NEON_STORAGE_REGION || process.env.AWS_REGION || process.env.S3_REGION || 'auto';
const NEON_STORAGE_ACCESS_KEY = process.env.NEON_STORAGE_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY;
const NEON_STORAGE_SECRET_KEY = process.env.NEON_STORAGE_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_KEY;
const NEON_BUCKET_NAME = process.env.NEON_BUCKET_NAME || process.env.S3_BUCKET || 'uploads';

let s3ClientInstance: S3Client | null = null;

export function getS3Client(): S3Client | null {
  if (!s3ClientInstance) {
    if (NEON_STORAGE_ENDPOINT && NEON_STORAGE_ACCESS_KEY && NEON_STORAGE_SECRET_KEY) {
      s3ClientInstance = new S3Client({
        endpoint: NEON_STORAGE_ENDPOINT,
        region: NEON_STORAGE_REGION,
        credentials: {
          accessKeyId: NEON_STORAGE_ACCESS_KEY,
          secretAccessKey: NEON_STORAGE_SECRET_KEY,
        },
        forcePathStyle: true, // Required for Neon, MinIO, and Cloudflare R2 custom endpoints
      });
    }
  }
  return s3ClientInstance;
}

export function isNeonStorageConfigured(): boolean {
  return !!(NEON_STORAGE_ENDPOINT && NEON_STORAGE_ACCESS_KEY && NEON_STORAGE_SECRET_KEY);
}

// Strict 5MB Upload Middleware for Images (JPEG/PNG) and PDF Documents
export const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 Megabytes limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only JPEG, PNG images, and PDF documents under 5MB are allowed.'));
    }
  },
});

export interface UploadFileOptions {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  folder?: string;
  organizationId?: string;
}

export interface StoredFileResult {
  fileUrl: string;
  key: string;
  bucket: string;
  sizeBytes: number;
  mimeType: string;
  isS3: boolean;
}

/**
 * Uploads a document to Neon Object Storage (S3-compatible) or falls back to local disk
 */
export async function uploadToStorage(options: UploadFileOptions): Promise<StoredFileResult> {
  const { buffer, originalName, mimeType, folder = 'documents', organizationId = 'general' } = options;
  const ext = path.extname(originalName) || (mimeType.includes('pdf') ? '.pdf' : '.jpg');
  const uniqueId = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  const key = `${folder}/${organizationId}/${uniqueId}${ext}`;

  const client = getS3Client();

  // 1. Neon S3 Object Storage
  if (client) {
    try {
      await client.send(
        new PutObjectCommand({
          Bucket: NEON_BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
          Metadata: {
            organizationId,
            originalName: encodeURIComponent(originalName),
            uploadedAt: new Date().toISOString(),
          },
        })
      );

      // Clean public URL or presigned URL
      const publicBase = process.env.NEON_STORAGE_PUBLIC_DOMAIN || NEON_STORAGE_ENDPOINT;
      const fileUrl = `${publicBase}/${NEON_BUCKET_NAME}/${key}`;

      console.log(`[Neon Object Storage] ✓ Successfully uploaded ${key} (${buffer.length} bytes)`);

      return {
        fileUrl,
        key,
        bucket: NEON_BUCKET_NAME,
        sizeBytes: buffer.length,
        mimeType,
        isS3: true,
      };
    } catch (err: any) {
      console.warn('[Neon Object Storage] S3 upload error, falling back to local disk:', err.message);
    }
  }

  // 2. Local Disk Storage Fallback
  const uploadsDir = path.join(process.cwd(), 'uploads', folder);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filename = `${uniqueId}${ext}`;
  const localFilePath = path.join(uploadsDir, filename);
  fs.writeFileSync(localFilePath, buffer);

  const localUrl = `/api/v1/vault/file/${filename}`;
  console.log(`[LocalStorage] Saved file locally at ${localFilePath}`);

  return {
    fileUrl: localUrl,
    key: filename,
    bucket: 'local-disk',
    sizeBytes: buffer.length,
    mimeType,
    isS3: false,
  };
}

export const storage = {
  getS3Client,
  isNeonStorageConfigured,
  documentUpload,
  uploadToStorage,
};
