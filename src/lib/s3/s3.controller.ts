import { PaginationDto } from '@/common/dto/pagination.dto';
import { ValidateAuth } from '@/common/jwt/jwt.decorator';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import * as multer from 'multer';
import { DeleteFilesRequestDto } from './dto/delete-file.dto';
import { UploadFilesRequestDto } from './dto/upload-file-request.dto';
import { UploadFilesResponseDto } from './dto/upload-file-response.dto';
import { S3Service } from './s3.service';
import { extname } from 'path';

@ApiBearerAuth()
@ValidateAuth()
@ApiTags('Files (S3) & DB')
@Controller('files')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Post()
  @ApiOperation({ summary: 'Upload multiple OR single files to S3' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadFilesRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Files uploaded successfully',
    type: UploadFilesResponseDto,
  })
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: multer.memoryStorage(),
      limits: { files: 5 },
    }),
  )
  async upload(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No file(s) uploaded');
    }

    if (files.length > 5) {
      throw new BadRequestException('You can upload a maximum of 5 files');
    }

    return this.s3Service.uploadFiles(files);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete multiple files from S3' })
  async deleteFiles(@Body() body: DeleteFilesRequestDto) {
    return this.s3Service.deleteFiles(body.fileIds);
  }

  @Get()
  @ApiOperation({ summary: 'Get all files from S3' })
  async getFiles(@Query() pg: PaginationDto) {
    return this.s3Service.getFiles(pg);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific file from S3' })
  async getFileById(@Param('id') id: string) {
    return this.s3Service.getFileById(id);
  }


   @Post('upload-to-vps')
  @ApiOperation({ summary: 'Upload multiple or single files to VPS' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Files uploaded successfully',
  })
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: multer.diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueName =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const fileExt = extname(file.originalname);
          callback(null, `${uniqueName}${fileExt}`);
        },
      }),
      limits: {
        files: 5,
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  async uploadToVps(@UploadedFiles() files: Express.Multer.File[]) {
    console.log(files)
    return {
      message: 'Files uploaded successfully',
      files: files.map((file) => ({
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
         url: `${process.env.BASE_URL}/uploads/${file.filename}`,
        size: file.size,
        mimetype: file.mimetype,
      })),
    };
  }
}
