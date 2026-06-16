import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { isAxiosError } from 'axios';
import FormData from 'form-data';

@Injectable()
export class UploadsService {
  constructor(private config: ConfigService) {}

  // ─── Upload image to ImageBB ───────────────

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'general',
  ): Promise<{ url: string; deleteUrl: string | null }> {
    // 1. validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG and WebP are allowed',
      );
    }

    // 2. validate file size — 5MB max
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size must not exceed 5MB');
    }

    try {
      const apiKey = this.config.getOrThrow<string>('IMGBB_API_KEY');

      // 3. convert buffer to base64 — ImageBB requires this format
      const base64Image = file.buffer.toString('base64');

      // 4. build form data
      const formData = new FormData();
      formData.append('image', base64Image);
      formData.append('name', `${folder}_${Date.now()}`);

      // 5. call ImageBB API
      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${apiKey}`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 15000, // 15 seconds timeout
        },
      );

      if (!response.data?.success) {
        throw new InternalServerErrorException(
          'ImageBB upload failed — no success response',
        );
      }

      return {
        url:       response.data.data.url,
        deleteUrl: response.data.data.delete_url ?? null,
      };
    } catch (error: unknown) {
  if (isAxiosError(error)) {
    console.error('ImageBB upload failed:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      code: error.code,
    });
  } else {
    console.error('Unexpected upload error:', error);
  }

  throw new InternalServerErrorException(
    'Failed to upload image. Please try again.',
  );
}
  }

  // ─── Delete image from ImageBB ─────────────

  async deleteImage(deleteUrl: string | null): Promise<void> {
    if (!deleteUrl) {
      // nothing to delete — silently return
      return;
    }

    try {
      // ImageBB deletion works by visiting the delete URL
      await axios.get(deleteUrl, { timeout: 10000 });
    } catch {
      // do not throw — deletion failure should never crash the main flow
      // the image may already be gone or the URL may have expired
      console.warn(`Could not delete image from ImageBB: ${deleteUrl}`);
    }
  }
}