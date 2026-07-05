import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class R2Service {
  private readonly logger = new Logger(R2Service.name);
  private s3Client: S3Client | null = null;
  private bucketName: string | null = null;
  private isFallback = true;
  private readonly localUploadDir = path.join(process.cwd(), 'uploads', 'evidence');

  constructor(private configService: ConfigService) {
    const accessKeyId = process.env.R2_ACCESS_KEY_ID || this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    const endpoint = process.env.R2_ENDPOINT || this.configService.get<string>('R2_ENDPOINT');
    this.bucketName = process.env.R2_BUCKET_NAME || this.configService.get<string>('R2_BUCKET_NAME') || null;

    this.logger.log(
      `Checking R2 env variables: R2_ACCESS_KEY_ID=${accessKeyId ? 'configured' : 'missing'}, ` +
      `R2_SECRET_ACCESS_KEY=${secretAccessKey ? 'configured' : 'missing'}, ` +
      `R2_ENDPOINT=${endpoint ? 'configured' : 'missing'}, ` +
      `R2_BUCKET_NAME=${this.bucketName ? 'configured' : 'missing'}`
    );

    if (accessKeyId && secretAccessKey && endpoint && this.bucketName) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.isFallback = false;
      this.logger.log('Cloudflare R2 storage initialized successfully.');
    } else {
      this.logger.warn(
        'Cloudflare R2 configuration missing or incomplete. Falling back to local filesystem storage for action evidence.',
      );
      // Ensure local upload directory exists
      if (!fs.existsSync(this.localUploadDir)) {
        fs.mkdirSync(this.localUploadDir, { recursive: true });
      }
    }
  }

  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    fileType: string,
  ): Promise<{ fileUrl: string; fileKey: string }> {
    const fileExt = path.extname(originalName);
    const uniqueKey = `evidence/${crypto.randomUUID()}${fileExt}`;

    if (!this.isFallback && this.s3Client && this.bucketName) {
      try {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: uniqueKey,
            Body: fileBuffer,
            ContentType: fileType,
          }),
        );
        
        const publicUrl = this.configService.get<string>('R2_PUBLIC_URL');
        const fileUrl = publicUrl ? `${publicUrl}/${uniqueKey}` : uniqueKey;
        
        return { fileUrl, fileKey: uniqueKey };
      } catch (error) {
        this.logger.error(`R2 Upload failed: ${error.message}`, error.stack);
        throw error;
      }
    } else {
      // Local fallback
      const filePath = path.join(this.localUploadDir, path.basename(uniqueKey));
      fs.writeFileSync(filePath, fileBuffer);
      const port = this.configService.get<string>('PORT') || '3000';
      const fileUrl = `http://localhost:${port}/uploads/evidence/${path.basename(uniqueKey)}`;
      return { fileUrl, fileKey: uniqueKey };
    }
  }

  async getPresignedUrl(fileKey: string): Promise<string> {
    if (!this.isFallback && this.s3Client && this.bucketName) {
      try {
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: fileKey,
        });
        // Presigned URL valid for 1 hour (3600 seconds)
        return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
      } catch (error) {
        this.logger.error(`Failed to generate R2 presigned URL: ${error.message}`);
        return fileKey;
      }
    } else {
      // Local fallback - fileKey is local path, return local URL
      const port = this.configService.get<string>('PORT') || '3000';
      return `http://localhost:${port}/uploads/evidence/${path.basename(fileKey)}`;
    }
  }

  async deleteFile(fileKey: string): Promise<void> {
    if (!this.isFallback && this.s3Client && this.bucketName) {
      try {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: fileKey,
          }),
        );
      } catch (error) {
        this.logger.error(`Failed to delete file from R2: ${error.message}`);
      }
    } else {
      // Local fallback
      const filePath = path.join(this.localUploadDir, path.basename(fileKey));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }
}
