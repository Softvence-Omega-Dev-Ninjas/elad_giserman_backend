import { PrismaService } from '@/lib/prisma/prisma.service';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PlatformFilter } from '../dto/getPlatform.dto';
import { UpdateStatusDto } from '../dto/updateStatus.dto';
import { subDays, format } from 'date-fns';
import { CreateCustomAppDto } from '../dto/customApp.dto';
import { S3Service } from '@/lib/s3/s3.service';
import { CreateSpinDto, UpdateSpinDto } from '../dto/spin.dto';
// import { log } from 'console';
@Injectable()
export class AdminPlatfromManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async getPlatfromStat(filter: PlatformFilter) {
    const { search, date, userType } = filter;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (userType) {
      where.memberShip = userType;
    }

    if (date) {
      const selected = new Date(date);
      const nextDay = new Date(selected);
      nextDay.setDate(selected.getDate() + 1);

      where.createdAt = {
        gte: selected,
        lt: nextDay,
      };
    }

    const [
      totalUser,
      totalFreeUser,
      totalOrganizer,
      users,
      topBusiness,

      //* NEW: Recent activity
      recentUsers,
      recentBusinessProfile,
      recentReviews,
      recentOffers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: { memberShip: 'FREE' },
      }),
      this.prisma.user.count({
        where: { role: 'ORGANIZER' },
      }),
      this.prisma.user.findMany({ where }),

      this.prisma.businessProfile.findMany({
        orderBy: { reviews: { _count: 'desc' } },
      }),

      //  Recent users
      this.prisma.user.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 1,
      }),

      //  Recent business profiles
      this.prisma.businessProfile.findMany({
        orderBy: { updatedAt: 'desc'},
        take: 5,
      }),

      // Recent reviews
      this.prisma.review.findMany({
        orderBy: { updatedAt: 'desc'},
        take: 1,
        include: {
          user: true,
          businessProfile: true,
        },
      }),
      //
      this.prisma.offer.findMany({
        orderBy: { updatedAt: 'desc', },
        take: 1,
        include: {
          business: {
            select: {
              title: true,
            },
          },
        },
      }),
    ]);

    return {
      totalUser,
      totalFreeUser,
      totalVipUser: totalUser - totalFreeUser,
      totalOrganizer,
      users,

      topBusinessProfile: topBusiness,

      recentActivity: {
        users: recentUsers,
        businessProfiles: recentBusinessProfile,
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
    const isUserExist = await this.prisma.user.findUnique({
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
    const isUserExist = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!isUserExist) {
      throw new NotFoundException(`User not found with given id ${userId}`);
    }
    await this.prisma.user.delete({
      where: {
        id: userId,
      },
    });
    return {
      status: HttpStatus.OK,
      message: 'User delete successful',
    };
  }

  // update user status
  async UpdateUserStatus(dto: UpdateStatusDto, userId: string) {
    if (!userId) {
      throw new BadRequestException('user id is required');
    }
    const isUserExist = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!isUserExist) {
      throw new NotFoundException(`User not found with given id ${userId}`);
    }
    await this.prisma.user.update({
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

  async getSubscriptionGrowth() {
    // Get today's date
    const now = new Date();

    // Get date 6 months ago
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); // include current month

    // Fetch subscriptions within last 6 months
    const subscriptions = await this.prisma.userSubscription.findMany({
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

  async getRedemptionGrowth() {
    const today = new Date();
    const startDate = subDays(today, 14); // last 15 days including today

    // Fetch redemption logs in the last 15 days
    const logs = await this.prisma.reedemaOffer.findMany({
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
    const existing = await this.prisma.customApp.findFirst();

    // CREATE if no record exists
    if (!existing) {
      return await this.prisma.customApp.create({
        data: {
          ...dto,
          bannerCard: bannerCardUrl?.url,
          bannerPhoto: bannerPhotoUrl?.url,
          logo: logoUrl?.url,
        },
      });
    }

    // UPDATE existing record
    return await this.prisma.customApp.update({
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
    const isSpinExist = await this.prisma.spin.findFirst();
    if (isSpinExist) {
      throw new BadRequestException(
        'Spin data already exist, you can update it',
      );
    }
    const res = await this.prisma.spin.create({
      data: {
        ...dto,
      },
    });
    return res;
  }

  //* UPDATE SPIN
  async updateSpinData(dto: UpdateSpinDto) {
    const isSpinExist = await this.prisma.spin.findFirst();
    if (!isSpinExist) {
      throw new NotFoundException('Spin data not found to update');
    }
    const res = await this.prisma.spin.update({
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
    const isSpinExist = await this.prisma.spin.findFirst();
    if (!isSpinExist) {
      throw new NotFoundException('Spin data not found');
    }
    return isSpinExist;
  }

  //*reset spin
  async resetSpintable() {
    const isExist = await this.prisma.spin.findFirst();
    if (!isExist) {
      throw new NotFoundException('Spin data not found');
    }
    await this.prisma.spin.update({
      where: {
        id: isExist.id,
      },
      data: {
        spinValue1: 0,
        spinValue2: 0,
        spinValue3: 0,
        spinValue4: 0,
        spinValue5: 0,
        spinValue6: 0,
        spinValue7: 0,
        spinValue8: 0,
        spinValue9: 0,
        spinValue10: 0,
      },
    });
    return {
      status: HttpStatus.OK,
      message: 'Spin data reset successfully',
    };
  }
}
