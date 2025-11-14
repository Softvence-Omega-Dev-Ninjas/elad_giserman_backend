import { PrismaService } from '@/lib/prisma/prisma.service';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PlatformFilter } from '../dto/getPlatform.dto';
import { UpdateStatusDto } from '../dto/updateStatus.dto';

@Injectable()
export class AdminPlatfromManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlatfromStat(filter: PlatformFilter) {
    const { search, date, userType } = filter;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensetive' } },
        { email: { contains: search, mode: 'insensetive' } },
        { mobile: { contains: search, mode: 'insensetive' } },
      ];
    }
    if (userType) {
      where.memberShip = userType;
    }
    if (date) {
      const selected = new Date(date);
      const nextDay = new Date(selected);
      nextDay.setDate(selected.getDate() + 1);
      //This ensures only records created on that calendar date are matched
      where.createdAt = {
        gte: selected,
        lt: nextDay,
      };
    }

    const [totalUser, totalFreeUser, totalOrganizer, users] = await Promise.all(
      [
        this.prisma.user.count(),
        this.prisma.user.count({
          where: {
            memberShip: 'FREE',
          },
        }),
        this.prisma.user.count({
          where: {
            role: 'ORGANIZER',
          },
        }),
        this.prisma.user.findMany({
          where,
        }),
      ],
    );
    const totalVipMember = totalUser - totalFreeUser;
    return {
      totalUser: totalUser,
      totalFreeUser: totalFreeUser,
      totalVipUser: totalVipMember,
      totalOrganizer: totalOrganizer,
      users: users,
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
}
