import { PrismaService } from '@/lib/prisma/prisma.service';
import { S3Service } from '@/lib/s3/s3.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateUserInfoDto } from './dto/update-user-info.dto';

@Injectable()
export class UserInfoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  // find my profile
  async finMyProfile(userId: string) {
    const result = await this.prisma.user.findFirst({
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
    const res = await this.prisma.user.update({
      where: {
        id: id,
      },
      data: data,
    });

    return res;
  }

  // delete my account
  async deleteMyAccount(id: string) {
    const res = await this.prisma.user.delete({
      where: {
        id: id,
      },
    });
    return res;
  }

  // scan qr code for get offer-------
  // user will go to restaurate and scan the qr code and get the offer
  async scanOffer(code: string, userId: string) {
    const offer = await this.prisma.offer.findFirst({
      where: { code },
      include: { business: true },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    if (!offer.isActive) throw new BadRequestException('Offer inactive');
    if (offer.expiredsAt && offer.expiredsAt < new Date())
      throw new BadRequestException('Offer expired');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const usersSubscription = await this.prisma.userSubscription.findFirst({
      where: {
        userId: userId,
      },
    });
    // TODO: Here should be just acces primieum user after the payment complete It will update to active --> primium
    if (!user || usersSubscription?.status == 'ACTIVE')
      throw new ForbiddenException('Only premium users can redeem');

    const redeemed = await this.prisma.reedemaOffer.findFirst({
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

  // confimation Redeem offer  and store the data to database
  async redeemOffer(code: string, userId: string) {
    const offer = await this.prisma.offer.findFirst({
      where: { code },
    });
    if (!offer) throw new NotFoundException('Offer not found');

    const redeemed = await this.prisma.reedemaOffer.findFirst({
      where: { offerId: offer.id, userId },
    });
    if (redeemed) throw new BadRequestException('Already redeemed');

    const log = await this.prisma.reedemaOffer.create({
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
      offer: { id: offer.id, title: offer.title, logId: log.id },
    };
  }

  async getUserRedeemedOffers(userId: string) {
    return this.prisma.reedemaOffer.findMany({
      where: { userId },
      include: { offer: true, business: true },
      orderBy: { createdAt: 'desc' },
    });
  }


  async getUserNotifications(userId: string) {
  // Get today start (00:00)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);
  
//* Yesterday end (23:59:59)
  const yesterdayEnd = new Date(todayStart);

  // * Today notifications
  const today = await this.prisma.userNotification.findMany({
    where: {
      userId,
      createdAt: {
        gte: todayStart,
      },
    },
    include: {
      notification: true,
    },
    orderBy: { createdAt: "desc" },
  });

  //* Yesterday notifications
  const yesterday = await this.prisma.userNotification.findMany({
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
    orderBy: { createdAt: "desc" },
  });

  return {
    today,
    yesterday,
  };
}

}
