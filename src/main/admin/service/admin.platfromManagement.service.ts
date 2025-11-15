import { PrismaService } from '@/lib/prisma/prisma.service';
import {
  BadRequestException, HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PlatformFilter } from '../dto/getPlatform.dto';
import { UpdateStatusDto } from '../dto/updateStatus.dto';
import { subDays, format } from 'date-fns';
import { CreateTermsAndConditionsDto, UpdateTermsAndConditionsDto } from '../dto/termAndCondition.dto';
@Injectable()
export class AdminPlatfromManagementService {
  constructor(private readonly prisma: PrismaService) {}

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

      // NEW: Recent activity
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
        orderBy: { createdAt: 'desc', updatedAt: 'desc' },
        take: 1,
      }),

      //  Recent business profiles
      this.prisma.businessProfile.findMany({
        orderBy: { createdAt: 'desc', updatedAt: 'desc' },
        take: 5,
      }),

      // Recent reviews
      this.prisma.review.findMany({
        orderBy: { createdAt: 'desc', updatedAt: 'desc' },
        take: 1,
        include: {
          user: true,
          businessProfile: true,
        },
      }),
      //
      this.prisma.offer.findMany({
        orderBy: { createdAt: 'desc', updatedAt: 'desc' },
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

  //  get user details
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

  //  delete user
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


  // ** CREATE TERMS AND CONDITIONS FOR PLATFORM
  async postTermAndConditions(dto:CreateTermsAndConditionsDto){
    const res=await this.prisma.termsAndConditions.create({
      data:{
        ...dto
      }
    })
    return res
  }

  // ** UPATED TERM AND CONDITIONS 
  async updateTermsAndCondition(id:string,dto:UpdateTermsAndConditionsDto){
    if(!id){
      throw new BadRequestException('terms id is required')
    }
    const isExistTerms=await this.prisma.termsAndConditions.findFirst({
      where:{
        id:id
      }
    })
    if(!isExistTerms){
      throw new NotFoundException("Your given temrm not found")
    }

    const res=await this.prisma.termsAndConditions.update({
      where:{
        id:id
      },
      data:{
        account:dto.account,
        reservations:dto.reservations,
        subscription:dto.subscription,
        offerAndRedemtions:dto.offerAndRedemtions,
        businesses:dto.businesses,
        adminRight:dto.adminRight,
        dataAndPolicy:dto.dataAndPolicy,
        liability:dto.liability,
        governingLaw:dto.governingLaw,
      }
    })
    return res
  }
  

  // **   GET TERMS AND CONDITIONS
  async getTermsAndCondition(){
    const res=await this.prisma.termsAndConditions.findFirst()
    return res
  }
}
