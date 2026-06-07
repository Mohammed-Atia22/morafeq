import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadsService {
  private s3: S3Client;
  private bucket: string;

  constructor(private config: ConfigService) {
    this.s3 = new S3Client({
      region: config.get<string>('AWS_REGION')!,
      credentials: {
        accessKeyId:     config.get<string>('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: config.get<string>('AWS_SECRET_ACCESS_KEY')!,
      },
    });
    this.bucket = config.get<string>('AWS_S3_BUCKET')!;
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string,
  ): Promise<string> {
    // validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, and WebP images are allowed'
      );
    }

    // validate file size — max 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Image must be smaller than 5MB');
    }

    // generate unique filename
    const extension = file.originalname.split('.').pop();
    const filename   = `${folder}/${uuidv4()}.${extension}`;

    // upload to S3
    await this.s3.send(
      new PutObjectCommand({
        Bucket:      this.bucket,
        Key:         filename,
        Body:        file.buffer,
        ContentType: file.mimetype,
      }),
    );

    // return public URL
    return `https://${this.bucket}.s3.${this.config.get('AWS_REGION')}.amazonaws.com/${filename}`;
  }

  async deleteImage(imageUrl: string): Promise<void> {
    // extract the key from the full URL
    const key = imageUrl.split('.amazonaws.com/')[1];
    if (!key) return;

    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key:    key,
      }),
    );
  }
}