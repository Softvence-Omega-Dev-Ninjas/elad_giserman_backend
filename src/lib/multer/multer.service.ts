import { Injectable } from '@nestjs/common';
import { diskStorage } from 'multer';
import * as path from 'path';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { v4 as uuid } from 'uuid';

export enum FileType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  VIDEO = 'video',
  AUDIO = 'audio',
  ANY = 'any',
}

@Injectable()
export class MulterService {
  private mimeTypesMap = {
    [FileType.IMAGE]: ['image/jpeg', 'image/png', 'image/webp'],
    [FileType.DOCUMENT]: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    [FileType.VIDEO]: ['video/mp4', 'video/webm', 'video/ogg'],
    [FileType.AUDIO]: ['audio/mpeg', 'audio/ogg', 'audio/wav'],
  };

  public createMulterOptions(
    destinationFolder: string,
    prefix: string,
    fileType: FileType = FileType.IMAGE,
    fileSizeLimit = 10 * 1024 * 1024,
    customMimeTypes?: string[], // Optional override
  ): MulterOptions {
    const allowedMimeTypes =
      fileType === FileType.ANY
        ? null
        : customMimeTypes || this.mimeTypesMap[fileType] || [];

    return {
      storage: diskStorage({
        destination: destinationFolder,
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname);
          cb(null, `${prefix}-${uuid()}${ext}`);
        },
      }),
      limits: {
        fileSize: fileSizeLimit,
      },
      fileFilter: (req, file, cb) => {
        if (!allowedMimeTypes || allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
        }
      },
    };
  }
}
