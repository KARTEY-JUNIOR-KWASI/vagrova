import { Injectable, Logger } from '@nestjs/common';
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
    // Ensure local directory exists in development
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Uploads an object (document scan, cargo photo, or voice note).
   * Returns a persistent file key.
   */
  async uploadFile(file: StorageFile, folder = 'general'): Promise<string> {
    const targetDir = path.join(this.uploadDir, folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const uniqueKey = `${folder}/${Date.now()}_${file.filename.replace(/[^a-zA-Z0-9._-]/g, '')}`;
    const destination = path.join(this.uploadDir, uniqueKey);

    await fs.promises.writeFile(destination, file.buffer);
    this.logger.log(`[STORAGE] Stored file reference: ${uniqueKey}`);

    return uniqueKey;
  }

  /**
   * Returns public/authenticated access URL or streaming stream.
   */
  getFileUrl(fileKey: string): string {
    return `/storage/${fileKey}`;
  }
}

