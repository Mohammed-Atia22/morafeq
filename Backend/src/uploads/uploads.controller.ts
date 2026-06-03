import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { CreateUploadDto } from './dto/create-upload.dto';
import { UpdateUploadDto } from './dto/update-upload.dto';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}
}
