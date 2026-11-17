import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PrismaService } from '@/common/prisma/prisma.service';
import { User } from '@prisma/client';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'audio/mpeg',
  'audio/mp4',
  'audio/webm',
  'audio/ogg',
]);

interface UploadedStorageFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

@Controller('storage')
export class StorageController {
  private readonly uploadDir = path.resolve(process.cwd(), 'uploads');

  constructor(
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
    }),
  )
  async uploadFile(
    @CurrentUser() user: User,
    @UploadedFile() file: UploadedStorageFile,
    @Query('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type "${file.mimetype}". Allowed: JPEG, PNG, WebP, PDF, or audio.`,
      );
    }

    const safeFolder = (folder || 'general').replace(/[^a-zA-Z0-9_-]/g, '');
    const fileKey = await this.storageService.uploadFile(
      {
        buffer: file.buffer,
        filename: file.originalname,
        mimetype: file.mimetype,
      },
      safeFolder,
    );

    if (safeFolder === 'avatars') {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { photoKey: fileKey },
      });
    }

    return {
      fileKey,
      url: this.storageService.getFileUrl(fileKey),
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  @Get(':folder/:filename')
  async serveFile(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
    const safeName = path.basename(filename);
    const fullPath = path.resolve(this.uploadDir, safeFolder, safeName);

    if (!fullPath.startsWith(this.uploadDir) || !fs.existsSync(fullPath)) {
      throw new NotFoundException('File not found');
    }

    return res.sendFile(fullPath);
  }
}
