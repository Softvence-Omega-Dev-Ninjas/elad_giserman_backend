import { PrismaService } from '@/lib/prisma/prisma.service';
import { S3Service } from '@/lib/s3/s3.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { FileType } from '@prisma';

import { GetReviewDto } from '@/main/admin/dto/getReview.dto';
import { CreateTermsAndConditionsDto } from '@/main/admin/dto/termAndCondition.dto';
import { CreateBusinessProfileDto } from '../dto/create-bussiness-profile.dto';
import { ProfileFilter } from '../dto/getProfileWithFilter.dto';
import { UpdateBusinessProfileDto } from '../dto/update-bussiness-profile.dto';
import {
  CreateUserTermsAndConditionsDto,
  UpdateUserTermsAndConditionsDto,
} from '../dto/termsAndContidion.dto';
import { ReservationFilter } from '../dto/getReservation.dto';

function shuffleArray<T>(array: T[]): T[] {
  return array.sort(() => Math.random() - 0.5);
}

@Injectable()
export class BusinessProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

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

    const existingProfile = await this.prisma.client.businessProfile.findUnique(
      {
        where: { ownerId: id },
      },
    );
    if (existingProfile) {
      throw new BadRequestException(
        'You already have a bussiness profile. Each organizer can only create one.',
      );
    }

    // create business profile in Prisma
    const { categoryId, ...restDto } = dto;
    console.log(dto);
    return this.prisma.client.businessProfile.create({
      data: {
        ...restDto,
        ownerId: id,
        categoryId: dto.categoryId,
        profileTypeName: dto.profileTypeName,
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

  //* get my businessProfile
  async getBusinessProfile(id: string) {
    const profile = await this.prisma.client.businessProfile.findUnique({
      where: { ownerId: id },
      include: {
        gallery: true,
        offers: true,
        reviews: true,
        reedemOffer: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('You do not have a business profile yet.');
    }

    return profile;
  }
  //* update profile
  async update(
    userId: string,
    dto: UpdateBusinessProfileDto,
    galleryFiles: Express.Multer.File[] = [],
  ) {
    // 1. Load existing profile
    const existingProfile = await this.prisma.client.businessProfile.findFirst({
      where: { ownerId: userId },
      include: { gallery: true },
    });

    if (!existingProfile) {
      throw new NotFoundException('No business profile found for this user.');
    }

    // 2. Parse existingImages JSON string
    let clientExistingImages: any[] = [];
    if (dto.existingImages) {
      try {
        clientExistingImages =
          typeof dto.existingImages === 'string'
            ? JSON.parse(dto.existingImages)
            : dto.existingImages;

        if (!Array.isArray(clientExistingImages)) {
          throw new BadRequestException('existingImages must be an array');
        }
      } catch (e) {
        throw new BadRequestException(e.message);
      }
    }

    // 3. Upload new gallery files
    let uploadedFiles: any[] = [];
    if (galleryFiles.length > 0) {
      uploadedFiles = await Promise.all(
        galleryFiles.map((file) => this.s3Service.uploadFile(file)),
      );
    }

    // 4. Build combined gallery array
    const newGallery: any[] = [];

    // Existing images
    newGallery.push(
      ...clientExistingImages.map((img) => ({
        filename: img.filename,
        originalFilename: img.originalFilename,
        path: img.path,
        url: img.url,
        fileType: img.fileType,
        mimeType: img.mimeType,
        size: img.size,
      })),
    );

    // Newly uploaded images
    newGallery.push(
      ...uploadedFiles.map((f) => ({
        filename: f.filename,
        originalFilename: f.originalFilename,
        path: f.path,
        url: f.url,
        fileType: f.fileType,
        mimeType: f.mimeType,
        size: f.size,
      })),
    );

    // 5. Prepare updateData
    const { existingImages, ...restDto } = dto;
    console.log(existingImages);
    const updateData: any = { ...restDto };

    // Convert isActive to boolean
    if (updateData.isActive !== undefined) {
      updateData.isActive =
        updateData.isActive === 'true' || updateData.isActive === true;
    }

    // Remove old gallery
    updateData.gallery = { set: [] };

    // Add new gallery array
    if (newGallery.length > 0) {
      updateData.gallery.create = newGallery;
    }

    // 6. Update profile in DB
    const updatedProfile = await this.prisma.client.businessProfile.update({
      where: { id: existingProfile.id },
      data: updateData,
      include: { gallery: true },
    });

    return updatedProfile;
  }

  //* get all profile
  async getAllProfiles(filter: ProfileFilter) {
    const { search, profileType, page = 1, limit = 10 } = filter;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Category name filter
    if (profileType) {
      where.category = {
        name: { contains: profileType, mode: 'insensitive' },
      };
    }

    const profiles = await this.prisma.client.businessProfile.findMany({
      skip,
      take: limit,
      where,
      include: {
        category: true,
        gallery: true,
        reservation: true,
        owner: { select: { name: true } },
        _count: {
          select: {
            offers: true,
            reedemOffer: true,
            reservation: true,
          },
        },
      },
    });

    // Shuffle profiles randomly
    const shuffledProfiles = shuffleArray(profiles);

    // Fetch review stats for all profiles
    const reviewStats = await this.prisma.client.review.groupBy({
      by: ['businessProfileId'],
      _count: { rating: true },
      _avg: { rating: true },
    });

    // Merge profiles with stats and counts
    const profilesWithStats = shuffledProfiles.map((profile) => {
      const stats = reviewStats.find((r) => r.businessProfileId === profile.id);
      return {
        ...profile,
        totalOffers: profile._count.offers,
        totalRedemptions: profile._count.reedemOffer,
        reviewCount: stats?._count.rating || 0,
        avgRating: stats?._avg.rating || null,
      };
    });

    return profilesWithStats;
  }

  //* get all reviews
  async getAllReviews(userId: string) {
    const findOrganizationProfile =
      await this.prisma.client.businessProfile.findFirst({
        where: {
          ownerId: userId,
        },
      });
    console.info(findOrganizationProfile, 'odfjdjfdojfdfjdjfdjf');
    if (!findOrganizationProfile) {
      throw new NotFoundException('No business profile found for this user...');
    }
    const reviews = await this.prisma.client.review.findMany({
      where: {
        businessProfileId: findOrganizationProfile.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
    return reviews;
  }

  //* get single review
  async getSingleReview(id: string) {
    if (!id) {
      throw new BadRequestException('Review ID must be provided.');
    }
    const review = await this.prisma.client.review.findUnique({
      where: {
        id: id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
    if (!review) {
      throw new NotFoundException('Review not found.');
    }
    return review;
  }

  //* get organizations stat
  async getOrganizationStats(userId: string) {
    const findOrganizationProfile =
      await this.prisma.client.businessProfile.findFirst({
        where: {
          ownerId: userId,
        },
      });

    const [totalOffter, totalReedmOffer, totalReview] = await Promise.all([
      this.prisma.client.offer.count({
        where: {
          businessId: findOrganizationProfile?.id,
        },
      }),
      this.prisma.client.reedemaOffer.count({
        where: {
          bussinessId: findOrganizationProfile?.id,
          isRedeemed: true,
        },
      }),
      this.prisma.client.review.count({
        where: {
          businessProfileId: findOrganizationProfile?.id,
        },
      }),
    ]);
    return {
      totalOffter: totalOffter,
      totalReedmOffer: totalReedmOffer,
      totalReview: totalReview,
    };
  }

  //*CRETE TERMS AND CONDITIONS
  async createAdminTermsAdnConditions(
    dto: CreateUserTermsAndConditionsDto,
    userId: string,
  ) {
    const isExistTerm =
      await this.prisma.client.userTermsAndConditions.findFirst({
        where: {
          businessProfileId: userId,
        },
      });

    if (isExistTerm) {
      throw new BadRequestException(
        'Terms and Conditions already exist. You can only update it.',
      );
    }

    return await this.prisma.client.userTermsAndConditions.create({
      data: {
        generalAgrement: dto.generalAgrement,
        reservationConfirmation: dto.reservationConfirmation,
        arrvalAndSeatingPolicy: dto.arrvalAndSeatingPolicy,
        canceletionAndNoShows: dto.canceletionAndNoShows,
        modifications: dto.modifications,
        conductAndBehaviour: dto.conductAndBehaviour,
        policyUpdate: dto.policyUpdate,
        liability: dto.liability,
        businessProfileId: userId,
      },
    });
  }

  //*UPDATE TERMS AND CONDITIONS
  async updateAdminTermsAndConditions(
    dto: UpdateUserTermsAndConditionsDto,
    userId: string,
  ) {
    const isExistTerm =
      await this.prisma.client.userTermsAndConditions.findFirst({
        where: {
          businessProfileId: userId,
        },
      });

    if (!isExistTerm) {
      throw new NotFoundException('Terms and Conditions not found to update');
    }

    return this.prisma.client.userTermsAndConditions.update({
      where: {
        id: isExistTerm.id,
      },
      data: {
        ...dto,
      },
    });
  }

  //*GET TERMS AND CONDITIONS
  async getTemsAndConditions(userId: string) {
    const isExistTerm =
      await this.prisma.client.userTermsAndConditions.findFirst({
        where: {
          businessProfileId: userId,
        },
      });
    if (!isExistTerm) {
      throw new NotFoundException('Terms and Conditions not found');
    }
    return isExistTerm;
  }

  //*Get all redeemtions
  async getAllRedemtions(filter: GetReviewDto, userId: string) {
    const { page = 1, limit = 10, search } = filter;
    const skip = (page - 1) * limit;

    // 1. Find business profile
    const businessProfile = await this.prisma.client.businessProfile.findFirst({
      where: { ownerId: userId },
    });

    if (!businessProfile) {
      return [];
    }

    const where: any = {
      bussinessId: businessProfile.id,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.client.reedemaOffer.findMany({
      skip,
      take: limit,
      where,
      include: {
        offer: true,
        user: {
          select: {
            name: true,
            email: true,
            avatarUrl: true,
            id: true,
          },
        },
      },
    });
  }

  //*Get all reservations
  async getARestReservation(userId: string, filter: ReservationFilter) {
    const { page = 1, limit = 10, search, date } = filter;
    const skip = (page - 1) * limit;

    const findOrganizationProfile =
      await this.prisma.client.businessProfile.findFirst({
        where: {
          ownerId: userId,
        },
      });

    if (!findOrganizationProfile) {
      return [];
    }
    const where: any = {
      restaurntId: findOrganizationProfile.id,
    };
    if (search) {
      where.OR = [
        { reservationName: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (date) {
      where.createdAt = {
        gte: new Date(`${date}T00:00:00.000Z`),
        lte: new Date(`${date}T23:59:59.999Z`),
      };
    }
    const reservations = await this.prisma.client.reservation.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatarUrl: true,
            mobile: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
    const total = await this.prisma.client.reservation.count({ where });

    return {
      data: reservations,
      page,
      limit,
      total,
    };
  }

  // *Accept Reservation
  async acceptReservation(id: string) {
    const isExist = await this.prisma.client.reservation.findFirst({
      where: {
        id: id,
      },
    });
    if (!isExist) {
      throw new NotFoundException('Reservation not found');
    }
    const res = await this.prisma.client.reservation.update({
      where: {
        id: id,
      },
      data: {
        aproval: true,
      },
    });
    return res;
  }
}
