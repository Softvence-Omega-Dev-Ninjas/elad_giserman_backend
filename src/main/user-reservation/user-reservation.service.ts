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
    const res = await this.prisma.client.reservation.findMany({
      where: {
        userId: userId,
        isActive: true,
      },
    });
    return res;
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
