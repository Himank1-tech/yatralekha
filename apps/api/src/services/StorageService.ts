import fs from 'fs';
import path from 'path';
import { uploadToStorage, UploadFileOptions, StoredFileResult } from './storage';

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
   * Uploads file to Neon Object Storage (S3-compatible) or local disk fallback
   */
  public static async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    organizationId: string,
    folder: string = 'vault'
  ): Promise<UploadResult> {
    const res: StoredFileResult = await uploadToStorage({
      buffer: fileBuffer,
      originalName,
      mimeType,
      folder,
      organizationId,
    });

    return {
      storagePath: res.isS3 ? `s3://${res.bucket}/${res.key}` : path.join(this.uploadDir, res.key),
      fileName: res.key,
      mimeType: res.mimeType,
      sizeBytes: res.sizeBytes,
      url: res.fileUrl,
    };
  }

  /**
   * Retrieves a file from local storage or returns a path
   */
  public static getLocalFile(fileName: string): { filePath: string; exists: boolean } {
    this.ensureUploadDir();
    const safeBaseName = path.basename(fileName);
    const filePath = path.join(this.uploadDir, safeBaseName);
    const exists = fs.existsSync(filePath);

    // Also check subfolders if not in root uploads
    if (!exists) {
      const folders = ['documents', 'vault', 'pod'];
      for (const f of folders) {
        const subPath = path.join(this.uploadDir, f, safeBaseName);
        if (fs.existsSync(subPath)) {
          return { filePath: subPath, exists: true };
        }
      }
    }

    return { filePath, exists };
  }
}
