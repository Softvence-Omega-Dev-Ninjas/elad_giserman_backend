import { PrismaService } from '@/lib/prisma/prisma.service';
import { S3Service } from '@/lib/s3/s3.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { FileType } from '@prisma/client';

import { CreateBusinessProfileDto } from '../dto/create-bussiness-profile.dto';
import { UpdateBusinessProfileDto } from '../dto/update-bussiness-profile.dto';

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
    id: string,
    dto: CreateBusinessProfileDto,
    galleryFiles: Express.Multer.File[] = [],
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

    const existingProfile = await this.prisma.businessProfile.findUnique({
      where: { ownerId: id },
    });
    if (existingProfile) {
      throw new BadRequestException(
        'You already have a bussiness profile. Each organizer can only create one.',
      );
    }

    // create business profile in Prisma
    return this.prisma.businessProfile.create({
      data: {
        ...dto,
        ownerId: id,
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
    const profile = await this.prisma.businessProfile.findUnique({
      where: { ownerId: id },
      include: {
        gallery: true,
        offers: true,
        reviews: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('You do not have a business profile yet.');
    }

    return profile;
  }
  // update profile

  async update(
    userId: string,
    dto: UpdateBusinessProfileDto,
    galleryFiles: Express.Multer.File[] = [],
  ) {
    //  find existing profile
    const existingProfile = await this.prisma.businessProfile.findUnique({
      where: { ownerId: userId },
      include: { gallery: true },
    });

    if (!existingProfile) {
      throw new NotFoundException('No business profile found for this user.');
    }

    // upload new gallery images if provided
    let uploadedFiles: any[] = [];
    if (galleryFiles.length > 0) {
      uploadedFiles = await Promise.all(
        galleryFiles.map((file) => this.s3Service.uploadFile(file)),
      );
    }

    //  create data payload for update
    const updateData: any = { ...dto };

    // append gallery creation if new files were uploaded
    if (uploadedFiles.length > 0) {
      updateData.gallery = {
        create: uploadedFiles.map((f) => ({
          filename: f.filename,
          originalFilename: f.originalFilename,
          path: f.path,
          url: f.url,
          fileType: f.fileType as FileType,
          mimeType: f.mimeType,
          size: f.size,
        })),
      };
    }

    //  update the profile
    const updatedProfile = await this.prisma.businessProfile.update({
      where: { id: existingProfile.id },
      data: updateData,
      include: { gallery: true },
    });

    return updatedProfile;
  }

  
}
