import { Injectable } from '@nestjs/common';
// import { CreateUserInfoDto } from './dto/create-user-info.dto';
import { UpdateUserInfoDto } from './dto/update-user-info.dto';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { S3Service } from '@/lib/s3/s3.service';

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
}
