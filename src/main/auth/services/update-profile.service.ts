import { UserResponseDto } from '@/common/dto/user-response.dto';
import { AppError } from '@/common/error/handle-error.app';
import { HandleError } from '@/common/error/handle-error.decorator';
import { successResponse } from '@/common/utils/response.util';
import { FileService } from '@/lib/file/file.service';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { UtilsService } from '@/lib/utils/utils.service';
import { Injectable } from '@nestjs/common';
import { UpdateProfileDto } from '../dto/update-profile.dto';

@Injectable()
export class UpdateProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utils: UtilsService,
    private readonly fileService: FileService,
  ) {}

  @HandleError('Failed to update profile', 'User')
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    file?: Express.Multer.File,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // * if image is provided, upload to S3 and get the URL
    let imageUrl: string | undefined;
    if (file) {
      const uploadFile = await this.fileService.processUploadedFile(file);

      if (uploadFile) {
        imageUrl = uploadFile.url;
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name?.trim() ? dto.name.trim() : user.name,
        avatarUrl: imageUrl ? imageUrl : user.avatarUrl,
      },
    });
    return successResponse(
      this.utils.sanitizedResponse(UserResponseDto, updatedUser),
      'Profile updated successfully',
    );
  }
}
