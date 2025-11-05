import { PrismaService } from '@/lib/prisma/prisma.service';
import { S3Service } from '@/lib/s3/s3.service';
import { Injectable, NotFoundException } from '@nestjs/common';

import { FileType } from '@prisma/client';

import { Express } from 'express';
import { CreateBusinessProfileDto } from '../dto/create-bussiness-profile.dto';

@Injectable()
export class BusinessProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  /**
   * Create a business profile with optional gallery images
   * @param dto CreateBusinessProfileDto
   * @param galleryFiles array of Express.Multer.File
   */

  async create(
    dto: CreateBusinessProfileDto,
    galleryFiles: Express.Multer.File[] = [],
    userId: string,
  ) {
    let uploadedFiles: {
      filename: any;
      originalFilename: any;
      path: any;
      url: any;
      fileType: string;
      mimeType: any;
      size: any;
    }[] = [];

    // upload each gallery image to S3 & save in DB
    if (galleryFiles.length > 0) {
      uploadedFiles = await Promise.all(
        galleryFiles.map((file) => this.s3Service.uploadFile(file)),
      );
    }

    // create business profile in Prisma
    return this.prisma.businessProfile.create({
      data: {
        title: dto.title,
        description: dto.description,
        location: dto.location,
        isActive: dto.isActive ?? true,
        openingTime: dto.openingTime,
        closingTime: dto.closingTime,
        ownerId: userId,
        gallery:
          uploadedFiles.length > 0
            ? {
                create: uploadedFiles.map(
                  (f: {
                    filename: any;
                    originalFilename: any;
                    path: any;
                    url: any;
                    fileType: string;
                    mimeType: any;
                    size: any;
                  }) => ({
                    filename: f.filename,
                    originalFilename: f.originalFilename,
                    path: f.path,
                    url: f.url,
                    fileType: f.fileType as FileType,
                    mimeType: f.mimeType,
                    size: f.size,
                  }),
                ),
              }
            : undefined,
      },
      include: {
        gallery: true,
      },
    });
  }

  // get my businessProfile
  async getBusinessProfile(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Oranizer is not found');
    return await this.prisma.businessProfile.findUnique({
      where: {
        ownerId: id,
      },
    });
  }
}
