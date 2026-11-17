import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UploadResult {
  storagePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
}

export class StorageService {
  private static uploadDir = path.join(process.cwd(), 'uploads');

  private static ensureUploadDir(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Uploads file to S3-compatible storage (Cloudflare R2 / Supabase) or local disk fallback
   */
  public static async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    organizationId: string
  ): Promise<UploadResult> {
    const ext = path.extname(originalName) || '.pdf';
    const safeName = `${organizationId}_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;

    // 1. Check if S3 / Cloudflare R2 / Supabase credentials are configured
    const s3Endpoint = process.env.S3_ENDPOINT;
    const s3Bucket = process.env.S3_BUCKET;
    const s3AccessKey = process.env.S3_ACCESS_KEY;
    const s3SecretKey = process.env.S3_SECRET_KEY;

    if (s3Endpoint && s3Bucket && s3AccessKey && s3SecretKey) {
      try {
        const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
        const s3 = new S3Client({
          endpoint: s3Endpoint,
          region: process.env.S3_REGION || 'auto',
          credentials: {
            accessKeyId: s3AccessKey,
            secretAccessKey: s3SecretKey
          }
        });

        const key = `vault/${organizationId}/${safeName}`;
        await s3.send(
          new PutObjectCommand({
            Bucket: s3Bucket,
            Key: key,
            Body: fileBuffer,
            ContentType: mimeType
          })
        );

        const publicUrl = process.env.S3_PUBLIC_DOMAIN
          ? `${process.env.S3_PUBLIC_DOMAIN}/${key}`
          : `${s3Endpoint}/${s3Bucket}/${key}`;

        return {
          storagePath: `s3://${s3Bucket}/${key}`,
          fileName: safeName,
          mimeType,
          sizeBytes: fileBuffer.length,
          url: publicUrl
        };
      } catch (err: any) {
        console.warn('[StorageService] S3 upload failed, using local disk fallback:', err.message);
      }
    }

    // 2. Local Disk Storage Fallback
    this.ensureUploadDir();
    const filePath = path.join(this.uploadDir, safeName);
    fs.writeFileSync(filePath, fileBuffer);

    return {
      storagePath: filePath,
      fileName: safeName,
      mimeType,
      sizeBytes: fileBuffer.length,
      url: `/api/v1/vault/file/${safeName}`
    };
  }

  /**
   * Retrieves a file from local storage or returns a stream
   */
  public static getLocalFile(fileName: string): { filePath: string; exists: boolean } {
    this.ensureUploadDir();
    const safeBaseName = path.basename(fileName);
    const filePath = path.join(this.uploadDir, safeBaseName);
    return {
      filePath,
      exists: fs.existsSync(filePath)
    };
  }
}
