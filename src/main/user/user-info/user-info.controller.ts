import { GetUser, ValidateAuth } from '@/common/jwt/jwt.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UpdateUserInfoDto } from './dto/update-user-info.dto';
import { UserInfoService } from './user-info.service';

@ApiTags('USER Info')
@Controller('user-info')
@ValidateAuth()
@ApiBearerAuth()
export class UserInfoController {
  constructor(private readonly userInfoService: UserInfoService) {}

  @Get('my-profile')
  async findMyProfile(@GetUser('sub') id: string) {
    try {
      const res = await this.userInfoService.finMyProfile(id);
      return {
        message: 'Profile fetch succesful',
        data: res,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message, error.status);
    }
  }

  @Patch()
  @ApiBody({ type: UpdateUserInfoDto })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async updateUserProfile(
    @Body() updateUserInfoDto: UpdateUserInfoDto,
    @UploadedFile() file: Express.Multer.File,
    @GetUser('sub') id: string,
  ) {
    try {
      const res = await this.userInfoService.updateUserProfile(
        id,
        updateUserInfoDto,
        file,
      );
      return {
        status: HttpStatus.OK,
        message: 'Your profile updated successful',
        data: res,
      };
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  @Delete('delete-my-account')
  async deleteMyAccount(@GetUser('sub') id: string) {
    try {
      await this.userInfoService.deleteMyAccount(id);
      return {
        status: HttpStatus.OK,
        message: 'Your account deleted successful',
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message, error.status);
    }
  }

  @Get('scan/:code')
  async scanOffer(@Param('code') code: string, @GetUser('sub') userId: string) {
    return this.userInfoService.scanOffer(code, userId);
  }

  // Redeem after user confirms
  @Post('redeem/:code')
  async redeemOffer(
    @Param('code') code: string,
    @GetUser('sub') userId: string,
  ) {
    return this.userInfoService.redeemOffer(code, userId);
  }

  //  User sees all redeemed offers
  @Get('redeemed')
  async getRedeemedOffers(@GetUser('sub') userId: string) {
    return this.userInfoService.getUserRedeemedOffers(userId);
  }
}
