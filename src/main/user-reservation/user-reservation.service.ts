import { Injectable } from '@nestjs/common';
import { CreateReservationDto } from './dto/create-user-reservation.dto';
import { UpdateUserReservationDto } from './dto/update-user-reservation.dto';
import { PrismaService } from '@/lib/prisma/prisma.service';

@Injectable()
export class UserReservationService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createUserReservationDto: CreateReservationDto, userId: string) {
    const isResExit = await this.prisma.client.businessProfile.findFirst({
      where: {
        id: createUserReservationDto.restaurntId,
      },
    });
    if (!isResExit) {
      throw new Error('Restaurant not found');
    }
    const res = await this.prisma.client.reservation.create({
      data: {
        ...createUserReservationDto,
        userId: userId,
      },
    });
    return res;
  }

  async findAll(userId: string) {
    const now = new Date();

    // Get start of this week (Sunday)
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);

    // End of this week (Saturday)
    const endOfThisWeek = new Date(startOfThisWeek);
    endOfThisWeek.setDate(startOfThisWeek.getDate() + 6);
    endOfThisWeek.setHours(23, 59, 59, 999);

    // Start of last week
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

    // End of last week
    const endOfLastWeek = new Date(endOfThisWeek);
    endOfLastWeek.setDate(endOfThisWeek.getDate() - 7);

    const reservations = await this.prisma.client.reservation.findMany({
      where: {
        userId: userId,
        isActive: true,
        createdAt: {
          gte: startOfLastWeek,
          lte: endOfThisWeek,
        },
      },
      include: {
        restaurant: {
          select: {
            id: true,
            title: true,
            gallery: {
              select: { url: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Optional: separate this week and last week
    const lastWeekReservations = reservations.filter(
      (r) => r.createdAt >= startOfLastWeek && r.createdAt <= endOfLastWeek,
    );
    const thisWeekReservations = reservations.filter(
      (r) => r.createdAt >= startOfThisWeek && r.createdAt <= endOfThisWeek,
    );

    return {
      lastWeek: lastWeekReservations,
      thisWeek: thisWeekReservations,
    };
  }

  async findOne(id: string) {
    const isResExit = await this.prisma.client.reservation.findFirst({
      where: {
        id: id,
      },
    });
    if (!isResExit) {
      throw new Error('Reservation not found');
    }
    return isResExit;
  }

  update(id: number, updateUserReservationDto: UpdateUserReservationDto) {
    return `This action updates a #${id} userReservation`;
  }

  async remove(id: string) {
    const isExist = await this.prisma.client.reservation.findFirst({
      where: {
        id: id,
      },
    });
    if (!isExist) {
      throw new Error('Reservation not found');
    }
    const res = await this.prisma.client.reservation.delete({
      where: {
        id: id,
      },
    });
    return res;
  }
}
