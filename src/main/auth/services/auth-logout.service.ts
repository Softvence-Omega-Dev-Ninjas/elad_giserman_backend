import { AppError } from '@/common/error/handle-error.app';
import { HandleError } from '@/common/error/handle-error.decorator';
import { successResponse, TResponse } from '@/common/utils/response.util';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthLogoutService {
  constructor(private readonly prisma: PrismaService) {}

  @HandleError('Logout user failed')
  async logout(userId: string): Promise<TResponse<any>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isLoggedIn: false, lastLogoutAt: new Date() },
    });

    return successResponse(null, 'Logout successful');
  }
}
