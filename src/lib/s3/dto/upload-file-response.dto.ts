import { ApiProperty } from '@nestjs/swagger';
import { FileType } from '@prisma';

export class UploadedFileDto {
  @ApiProperty({ example: 'images/1699154587654-image1.jpg' })
  filename: string;

  @ApiProperty({ example: 'image1.jpg' })
  originalFilename: string;

  @ApiProperty({ example: 'images/1699154587654-image1.jpg' })
  path: string;

  @ApiProperty({
    example:
      'https://your-bucket-name.s3.ap-southeast-2.amazonaws.com/images/1699154587654-image1.jpg',
  })
  url: string;

  @ApiProperty({ enum: FileType, example: FileType.image })
  fileType: FileType;

  @ApiProperty({ example: 'image/jpeg' })
  mimeType: string;

  @ApiProperty({ example: 2136665 })
  size: number;
}

export class UploadFilesResponseDto {
  @ApiProperty({ type: [UploadedFileDto] })
  files: UploadedFileDto[];

  @ApiProperty({ example: 1 })
  count: number;
}
