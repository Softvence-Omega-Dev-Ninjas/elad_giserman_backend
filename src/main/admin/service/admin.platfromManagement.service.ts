import { PrismaService } from '@/lib/prisma/prisma.service';
import { S3Service } from '@/lib/s3/s3.service';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { format, isValid, subDays } from 'date-fns';
import { CreateCustomAppDto } from '../dto/customApp.dto';
import { GetOffersDto } from '../dto/getOffer.dto';
import { PlatformFilter } from '../dto/getPlatform.dto';
import { CreateSpinDto, UpdateSpinDto } from '../dto/spin.dto';
import { CreateTermsAndConditionsDto } from '../dto/termAndCondition.dto';
import { UpdateStatusDto } from '../dto/updateStatus.dto';
import { ReservationFilter } from '@/main/organizer/dto/getReservation.dto';
import * as bcrypt from 'bcrypt';
import { CreateBussinessOwnerDTO } from '../dto/create-bussiness-owner.dto';
// import { log } from 'console';
@Injectable()
export class AdminPlatfromManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  //*Get platform statictis
  async getPlatfromStat(filter: PlatformFilter) {
    const { search, date, userType } = filter;

    // ==========================
    // 1. Build User Filter
    // ==========================
    const userWhere: any = {};

    if (search) {
      userWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (userType) {
      userWhere.memberShip = userType; // FREE / VIP
    }

    if (date) {
      const selected = new Date(date);
      const nextDay = new Date(selected);
      nextDay.setDate(selected.getDate() + 1);

      userWhere.createdAt = {
        gte: selected,
        lt: nextDay,
      };
    }

    // ==========================
    // 2. Build Business Filter
    // (business has NO memberShip)
    // ==========================
    const businessWhere: any = {};

    if (search) {
      businessWhere.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (date) {
      const selected = new Date(date);
      const nextDay = new Date(selected);
      nextDay.setDate(selected.getDate() + 1);

      businessWhere.createdAt = {
        gtr: selected,
        lt: nextDay,
      };
    }

    const topBusiness = await this.prisma.client.businessProfile.findMany({
      where: businessWhere,
      take: 5,
      orderBy: {
        reviews: {
          _count: 'desc',
        },
      },
      include: {
        gallery: true,
      },
    });

    // ==========================
    // 3. Promise.all
    // ==========================
    const [
      totalUser,
      totalFreeUser,
      totalBusinessCount,

      recentUsers,
      recentBusinessProfiles,
      recentReviews,
      recentOffers,
      recentJoinedBusinesses,
    ] = await Promise.all([
      // User counts
      this.prisma.client.user.count(),

      this.prisma.client.user.count({
        where: { memberShip: 'FREE' },
      }),

      // Business count
      this.prisma.client.businessProfile.count(),

      // ⭐ FIXED — apply filtering + take top 5
      // Recent users
      this.prisma.client.user.findMany({
        where: userWhere,
        orderBy: { updatedAt: 'desc' },
        take: 1,
      }),

      // Recent businesses
      this.prisma.client.businessProfile.findMany({
        where: businessWhere,
        orderBy: { updatedAt: 'desc' },
        include: { gallery: true },
        take: 5,
      }),

      // Recent reviews
      this.prisma.client.review.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 1,
        include: {
          user: true,
          businessProfile: true,
        },
      }),

      // Recent offers
      this.prisma.client.offer.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 1,
        include: { business: { select: { title: true } } },
      }),

      // Recent joined businesses
      this.prisma.client.businessProfile.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const totalReservation = await this.prisma.client.reservation.count();
    return {
      totalUser,
      totalFreeUser,
      totalReservation,
      totalVipUser: totalUser - totalFreeUser,
      totalRest: totalBusinessCount,

      topRestaurent: topBusiness,
      recentJoinedBusinesses,

      recentActivity: {
        users: recentUsers,
        businessProfiles: recentBusinessProfiles,
        reviews: recentReviews,
        offers: recentOffers,
      },
    };
  }

  //*  get user details
  async getUserDetils(userId: string) {
    if (!userId) {
      throw new NotFoundException('user id is requird');
    }
    const isUserExist = await this.prisma.client.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!isUserExist) {
      throw new NotFoundException(`User not found with id ${userId}`);
    }
    return isUserExist;
  }

  //*  delete user
  async deleteuser(userId: string) {
    if (!userId) {
      throw new BadRequestException('User Id is requrid');
    }
    const isUserExist = await this.prisma.client.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!isUserExist) {
      throw new NotFoundException(`User not found with given id ${userId}`);
    }
    await this.prisma.client.user.delete({
      where: {
        id: userId,
      },
    });
    return {
      status: HttpStatus.OK,
      message: 'User delete successful',
    };
  }

  //* update user status
  async UpdateUserStatus(dto: UpdateStatusDto, userId: string) {
    if (!userId) {
      throw new BadRequestException('user id is required');
    }
    const isUserExist = await this.prisma.client.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!isUserExist) {
      throw new NotFoundException(`User not found with given id ${userId}`);
    }
    await this.prisma.client.user.update({
      where: {
        id: userId,
      },
      data: {
        status: dto.status,
      },
    });
    return {
      status: HttpStatus.OK,
      message: `User update to ${dto.status}`,
    };
  }

  //* get subscription growth
  async getSubscriptionGrowth() {
    // Get today's date
    const now = new Date();

    // Get date 6 months ago
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); // include current month

    // Fetch subscriptions within last 6 months
    const subscriptions = await this.prisma.client.userSubscription.findMany({
      where: {
        planStartedAt: {
          gte: sixMonthsAgo,
          lte: now,
        },
      },
      select: {
        planStartedAt: true,
      },
    });

    // Prepare last 6 months map
    const monthsMap: Record<string, number> = {};

    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);

      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      monthsMap[key] = 0;
    }

    // Count subscriptions per month
    subscriptions.forEach((sub) => {
      const d = new Date(sub.planStartedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthsMap[key] !== undefined) {
        monthsMap[key] += 1;
      }
    });

    // Convert to array sorted by oldest → newest
    const result = Object.entries(monthsMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));

    return {
      success: true,
      data: result,
    };
  }

  // *get redeemtion growth
  async getRedemptionGrowth() {
    const today = new Date();
    const startDate = subDays(today, 14); // last 15 days including today

    // Fetch redemption logs in the last 15 days
    const logs = await this.prisma.client.reedemaOffer.findMany({
      where: {
        redeemedAt: {
          gte: startDate,
          lte: today,
        },
      },
      select: {
        redeemedAt: true,
      },
    });

    // Initialize a map for last 15 days
    const growthMap: Record<string, number> = {};
    for (let i = 0; i < 15; i++) {
      const day = format(subDays(today, i), 'yyyy-MM-dd');
      growthMap[day] = 0;
    }

    // Count redemptions per day
    logs.forEach((log) => {
      const day = format(log.redeemedAt!, 'yyyy-MM-dd');
      if (growthMap[day] !== undefined) {
        growthMap[day] += 1;
      }
    });

    // Return sorted by date ascending
    const growth = Object.keys(growthMap)
      .sort()
      .map((date) => ({ date, count: growthMap[date] }));

    return growth;
  }

  //* Customize app
  async customizeApp(dto: CreateCustomAppDto, files: any) {
    // Upload each file to S3 (if provided)
    let logoUrl = null;
    let bannerCardUrl = null;
    let bannerPhotoUrl = null;

    if (files.logo?.[0]) {
      logoUrl = await this.s3Service.uploadFile(files.logo[0]);
    }

    if (files.bannerCard?.[0]) {
      bannerCardUrl = await this.s3Service.uploadFile(files.bannerCard[0]);
    }

    if (files.bannerPhoto?.[0]) {
      bannerPhotoUrl = await this.s3Service.uploadFile(files.bannerPhoto[0]);
    }
    // Check if record exists
    const existing = await this.prisma.client.customApp.findFirst();

    // CREATE if no record exists
    if (!existing) {
      return await this.prisma.client.customApp.create({
        data: {
          ...dto,
          bannerCard: bannerCardUrl?.url,
          bannerPhoto: bannerPhotoUrl?.url,
          logo: logoUrl?.url,
        },
      });
    }

    // UPDATE existing record
    return await this.prisma.client.customApp.update({
      where: { id: existing.id },
      data: {
        ...dto,
        bannerCard: bannerCardUrl?.url,
        bannerPhoto: bannerPhotoUrl?.url,
        logo: logoUrl?.url,
      },
    });
  }

  //*  CREATE SPIN TABLE
  async createSpinTable(dto: CreateSpinDto) {
    const isSpinExist = await this.prisma.client.spin.findFirst();
    if (isSpinExist?.spinValue1 === dto.spinValue1) {
      throw new BadRequestException('Your provided value already exist');
    }
    const res = await this.prisma.client.spin.create({
      data: {
        ...dto,
      },
    });
    return res;
  }

  //* UPDATE SPIN
  async updateSpinData(dto: UpdateSpinDto, spinId: string) {
    const isSpinExist = await this.prisma.client.spin.findFirst({
      where: {
        id: spinId,
      },
    });
    if (!isSpinExist) {
      throw new NotFoundException('Spin data not found to update');
    }
    const res = await this.prisma.client.spin.update({
      where: {
        id: isSpinExist.id,
      },
      data: {
        ...dto,
      },
    });
    return res;
  }

  //* get spin table
  async getSpinTableData() {
    const isSpinExist = await this.prisma.client.spin.findMany();
    return isSpinExist;
  }

  //* Delete Spin value
  async deleteSpin(id: string) {
    const isSpinExist = await this.prisma.client.spin.findUnique({
      where: {
        id: id,
      },
    });
    if (!isSpinExist) {
      throw new NotFoundException('Spin data not found to delete');
    }
    await this.prisma.client.spin.delete({
      where: {
        id: id,
      },
    });
    return {
      message: 'Spin data deleted successfully',
    };
  }

  //*CRETE TERMS AND CONDITIONS
  async createAdminTermsAdnConditions(dto: CreateTermsAndConditionsDto) {
    const isExistTerm = await this.prisma.client.termsAndConditions.findFirst();
    if (isExistTerm) {
      throw new BadRequestException(
        'Terms and Conditions already exist you can just update your terms and conditions',
      );
    }
    return this.prisma.client.termsAndConditions.create({
      data: {
        ...dto,
      },
    });
  }

  //*UPDATE TERMS AND CONDITIONS
  async updateAdminTermsAndConditions(dto: CreateTermsAndConditionsDto) {
    const isExistTerm = await this.prisma.client.termsAndConditions.findFirst();
    if (!isExistTerm) {
      throw new NotFoundException('Terms and Conditions not found to update');
    }
    return this.prisma.client.termsAndConditions.update({
      where: {
        id: isExistTerm.id,
      },
      data: {
        ...dto,
      },
    });
  }

  //*GET TERMS AND CONDITIONS
  async getTemsAndConditions() {
    const isExistTerm = await this.prisma.client.termsAndConditions.findFirst();
    if (!isExistTerm) {
      throw new NotFoundException('Terms and Conditions not found');
    }
    return isExistTerm;
  }

  //*get all users
  async getAllUsers({
    page,
    limit,
    search,
    status,
  }: {
    page: number;
    limit: number;
    search: string;
    status: string;
  }) {
    const skip = (page - 1) * limit;

    const where: any = search
      ? { name: { contains: search, mode: 'insensitive' } }
      : {};
    if (status) {
      where.status = status;
    }
    const [data, total] = await Promise.all([
      this.prisma.client.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.user.count({ where }),
    ]);

    return { data, total };
  }

  //* get all redemtion offer
  async getAlRedemtions({ page, limit }: { page: number; limit: number }) {
    const skip = (page - 1) * limit;
    const data = await this.prisma.client.reedemaOffer.findMany({
      skip,
      take: limit,
      include: {
        user: {
          select: {
            name: true,
          },
        },
        offer: {
          select: {
            title: true,
          },
        },
        business: {
          select: {
            title: true,
          },
        },
      },
    });

    return { data };
  }

  async getPaymentLog(filter: GetOffersDto) {
    const { page = 1, limit = 10 } = filter;
    const skip = (page - 1) * limit;
    const res = await this.prisma.client.invoice.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        createdAt: true,
        status: true,
        user: {
          select: {
            name: true,
            email: true,
            memberShip: true,
            currentPlan: true,
            currentPlanId: true,
          },
        },
      },
    });

    return res;
  }

  //* spin history
  async getSpinHistory(filter: GetOffersDto) {
    const { page = 1, limit = 10 } = filter;
    const skip = (page - 1) * 10;
    const res = await this.prisma.client.spinHistory.findMany({
      skip,
      take: limit,
      include: {
        user: true,
      },
    });
    return res;
  }

  //*get custom app details
  async getCustomAppDetails() {
    const res = await this.prisma.client.customApp.findFirst();
    return res;
  }

  async getAllReservation(filter: ReservationFilter) {
    const { page = 1, limit = 10, search, date } = filter;
    const skip = (page - 1) * limit;

    const where: any = {};
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
            mobile: true,
          },
        },
        restaurant: {
          select: {
            title: true,
            location: true,
            category: {
              select: {
                name: true,
              },
            },
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

  //* just for demo make a user premiun
  // TODO: It must be remove from here beacuse it very dangerous
  async makeDemoPremium(id: string) {
    const isUserExist = await this.prisma.client.user.findUnique({
      where: {
        id: id,
      },
    });
    if (!isUserExist) {
      throw new NotFoundException('User not found');
    }
    const res = await this.prisma.client.user.update({
      where: {
        id: id,
      },
      data: {
        memberShip: 'VIP',
        subscriptionStatus: 'ACTIVE',
      },
    });
    return res;
  }

  // create bussiness owner
  async createBussinessOwner(dto: CreateBussinessOwnerDTO) {
    // Check if email already exists
    const isEmailExist = await this.prisma.client.user.findUnique({
      where: { email: dto.email },
    });
    if (isEmailExist) {
      throw new BadRequestException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.client.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        password: hashedPassword,
        memberShip: 'FREE',
        subscriptionStatus: 'ACTIVE',
        role: 'ORGANIZER',
        isVerified: true,
      },
    });

    // Create business profile
    const businessProfile = await this.prisma.client.businessProfile.create({
      data: {
        ownerId: user.id,
        title: '',
        description: '',
        location: '',
        openingTime: '',
        closingTime: '',
      },
    });

    return { user, businessProfile };
  }
}
