import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface StorageFile {
  buffer: Buffer;
  filename: string;
  mimetype: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadDir = path.resolve(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  private get cloudinaryConfig() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
    if (cloudName && apiKey && apiSecret) {
      return { cloudName, apiKey, apiSecret };
    }
    return null;
  }

  /**
   * Uploads an object (document scan, cargo photo, or avatar).
   * Uses Cloudinary permanent cloud storage when configured, with local disk fallback.
   */
  async uploadFile(file: StorageFile, folder = 'general'): Promise<string> {
    const cloud = this.cloudinaryConfig;
    if (cloud) {
      try {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const cloudFolder = `vagrova/${folder}`;
        const sigBase = `folder=${cloudFolder}&timestamp=${timestamp}${cloud.apiSecret}`;
        const signature = crypto.createHash('sha1').update(sigBase).digest('hex');

        const form = new FormData();
        const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
        form.append('file', blob, file.filename);
        form.append('api_key', cloud.apiKey);
        form.append('timestamp', timestamp);
        form.append('folder', cloudFolder);
        form.append('signature', signature);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloud.cloudName}/auto/upload`,
          { method: 'POST', body: form },
        );

        if (res.ok) {
          const json = (await res.json()) as { secure_url?: string };
          if (json.secure_url) {
            this.logger.log(`[STORAGE-CLOUD] Uploaded to Cloudinary: ${json.secure_url}`);
            return json.secure_url;
          }
        } else {
          const errText = await res.text().catch(() => '');
          this.logger.warn(`[STORAGE-CLOUD] Cloudinary upload failed (${res.status}): ${errText}`);
        }
      } catch (err) {
        this.logger.warn(
          `[STORAGE-CLOUD] Cloudinary error, falling back to local disk: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    const targetDir = path.join(this.uploadDir, folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const uniqueKey = `${folder}/${Date.now()}_${file.filename.replace(/[^a-zA-Z0-9._-]/g, '')}`;
    const destination = path.join(this.uploadDir, uniqueKey);

    await fs.promises.writeFile(destination, file.buffer);
    this.logger.log(`[STORAGE-LOCAL] Stored file reference: ${uniqueKey}`);

    return uniqueKey;
  }

  /**
   * Returns direct cloud URL for remote objects or local /storage path.
   */
  getFileUrl(fileKey: string): string {
    if (fileKey.startsWith('http://') || fileKey.startsWith('https://')) {
      return fileKey;
    }
    return `/storage/${fileKey}`;
  }
}
