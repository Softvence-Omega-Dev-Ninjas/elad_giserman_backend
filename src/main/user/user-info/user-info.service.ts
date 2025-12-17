import { PrismaService } from '@/lib/prisma/prisma.service';
import { S3Service } from '@/lib/s3/s3.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SpinHistoryDto } from './dto/createSpinHistory.dto';
import { UpdateUserInfoDto } from './dto/update-user-info.dto';

@Injectable()
export class UserInfoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  // find my profile
  async finMyProfile(userId: string) {
    const result = await this.prisma.client.user.findFirst({
      where: {
        id: userId,
      },
    });
    if (!result) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = result;
    return safeUser;
  }

  // update user profile
  async updateUserProfile(
    id: string,
    updateUserInfoDto: UpdateUserInfoDto,
    file: any,
  ) {
    let profileImageUrl: string | null = null;
    if (file) {
      const uploaded = await this.s3Service.uploadFile(file);
      profileImageUrl = uploaded?.url ?? null;
    }
    const data: any = {
      name: updateUserInfoDto.name,
      mobile: updateUserInfoDto.phone,
    };
    if (profileImageUrl) {
      data.avatarUrl = profileImageUrl;
    }
    const res = await this.prisma.client.user.update({
      where: {
        id: id,
      },
      data: data,
    });

    return res;
  }

  // delete my account
  async deleteMyAccount(id: string) {
    const res = await this.prisma.client.user.delete({
      where: {
        id: id,
      },
    });
    return res;
  }

  // scan qr code for get offer-------
  // user will go to restaurate and scan the qr code and get the offer
  async scanOffer(code: string, userId: string) {
    const offer = await this.prisma.client.offer.findFirst({
      where: { code },
      include: { business: true },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    if (!offer.isActive) throw new BadRequestException('Offer inactive');
    if (offer.expiredsAt && offer.expiredsAt < new Date())
      throw new BadRequestException('Offer expired');

    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });
    const usersSubscription =
      await this.prisma.client.userSubscription.findFirst({
        where: {
          userId: userId,
        },
      });
    // TODO: Here should be just acces primieum user after the payment complete It will update to active --> primium
    if (!user || usersSubscription?.status == 'ACTIVE')
      throw new ForbiddenException('Only premium users can redeem');

    const redeemed = await this.prisma.client.reedemaOffer.findFirst({
      where: { offerId: offer.id, userId },
    });

    if (redeemed) {
      return {
        canRedeem: false,
        message: 'You already redeemed this offer',
      };
    }

    return {
      canRedeem: true,
      offer: {
        id: offer.id,
        title: offer.title,
        description: offer.description,
      },
      message: 'You can redeem this offer. Confirm to proceed.',
    };
  }

  //* confimation Redeem offer  and store the data to database
  async redeemOffer(code: string, offerId: string, userId: string) {
    const isUserPremiun = await this.prisma.client.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (isUserPremiun?.memberShip === 'FREE') {
      throw new BadRequestException('Only premium users can redeem offers');
    }

    const isAlreadyRedeem = await this.prisma.client.reedemaOffer.findFirst({
      where: {
        userId: userId,
        offerId: offerId,
      },
    });

    if (isAlreadyRedeem?.isClaimed) {
      throw new BadRequestException('You already redeemed this offer');
    }
    const offer = await this.prisma.client.offer.findFirst({
      where: {
        id: offerId,
        code,
      },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (!offer.isActive) {
      throw new BadRequestException('Offer inactive');
    }

    if (offer.expiredsAt && offer.expiredsAt < new Date()) {
      throw new BadRequestException('Offer has expired');
    }

    if (offer.status !== 'APPROVED') {
      throw new BadRequestException('Offer cannot be redeemed');
    }

    const alreadyRedeemed = await this.prisma.client.reedemaOffer.findFirst({
      where: { offerId: offer.id, userId },
    });

    if (alreadyRedeemed) {
      throw new BadRequestException('Already redeemed');
    }

    const log = await this.prisma.client.reedemaOffer.create({
      data: {
        offerId: offer.id,
        userId,
        redeemedAt: new Date(),
        expiresAt: new Date(),
        code: offer.code,
        bussinessId: offer.businessId,
        isRedeemed: true,
      },
    });

    return {
      success: true,
      message: 'Offer redeemed successfully!',
      offer: {
        id: offer.id,
        title: offer.title,
        logId: log.id,
      },
    };
  }

  async getUserRedeemedOffers(userId: string) {
    return this.prisma.client.reedemaOffer.findMany({
      where: { userId },
      include: { offer: true, business: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserNotifications(userId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1);

    const yesterdayEnd = new Date(todayStart);

    const today = await this.prisma.client.userNotification.findMany({
      where: {
        userId,
        createdAt: {
          gte: todayStart,
        },
      },
      include: {
        notification: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const yesterday = await this.prisma.client.userNotification.findMany({
      where: {
        userId,
        createdAt: {
          gte: yesterdayStart,
          lt: yesterdayEnd,
        },
      },
      include: {
        notification: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const unreadCount = await this.prisma.client.userNotification.count({
      where: {
        userId,
        read: false,
      },
    });

    return {
      unreadCount,
      today,
      yesterday,
    };
  }

  //* store spin history for user
  async createSpinHistory(userId: string, dto: SpinHistoryDto) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    // Check if user already spin this month
    const existingSpin = await this.prisma.client.spinHistory.findFirst({
      where: {
        userId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    if (existingSpin) {
      throw new Error('User has already spined this month.');
    }

    // Create new spin history
    const res = await this.prisma.client.spinHistory.create({
      data: {
        result: dto.result,
        userId,
      },
    });

    return res;
  }

  //*claimed offer
  async claimOffer(id: string, userId: string) {
    const isClaimed = await this.prisma.client.reedemaOffer.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    });
    if (!isClaimed) {
      throw new NotFoundException('You Did not redeem this offer yet');
    }
    if (isClaimed.isClaimed) {
      throw new BadRequestException('You already claimed this offer');
    }
    const res = await this.prisma.client.reedemaOffer.update({
      where: {
        id: id,
        userId: userId,
      },
      data: {
        isClaimed: true,
      },
    });
    return res;
  }

  //
  async markAllNotificationsAsRead(userId: string) {
    const res = await this.prisma.client.userNotification.updateMany({
      where: {
        userId: userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
    return res;
  }
}
