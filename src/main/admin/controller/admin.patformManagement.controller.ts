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
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AdminPlatfromManagementService } from '../service/admin.platfromManagement.service';
import { ValidateAdmin } from '@/common/jwt/jwt.decorator';
import { PlatformFilter } from '../dto/getPlatform.dto';
import { UpdateStatusDto } from '../dto/updateStatus.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CreateCustomAppDto } from '../dto/customApp.dto';

@Controller('platform')
@ApiTags('Platform management')
@ApiBearerAuth()
export class AdminPlatformManagementController {
  constructor(
    private readonly platformManagementService: AdminPlatfromManagementService,
  ) {}

  @Get()
  @ValidateAdmin()
  async getPlatformStat(@Query() filter: PlatformFilter) {
    try {
      const res = await this.platformManagementService.getPlatfromStat(filter);
      return {
        status: HttpStatus.OK,
        message: 'Platform stat fetch successful',
        data: res,
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('user/:id')
  async getUserDetails(@Param('id') id: string) {
    try {
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  @ValidateAdmin()
  @Delete('delete-user/:id')
  async deleteUserByAdmin(@Param('id') id: string) {
    try {
      return this.platformManagementService.deleteuser(id);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  @ValidateAdmin()
  @Patch('update-status/:id')
  @ApiConsumes('multipart/formdata')
  async updateUserStatus(
    @Body() dto: UpdateStatusDto,
    @Param('id') id: string,
  ) {
    try {
    } catch (err) {
      throw new HttpException(err.message, err.status);
    }
  }

  @Get('subscription-growth')
  async getSubscriptionGrouth() {
    try {
      const res = await this.platformManagementService.getSubscriptionGrowth();
      return {
        status: HttpStatus.OK,
        message: 'Subscription growth fetched successfully',
        data: res,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message, error.status);
    }
  }

  @Get('redemetion-growth')
  async getRedemetionGrowth() {
    try {
      const res = await this.platformManagementService.getRedemptionGrowth();
      return {
        status: HttpStatus.OK,
        message: 'Redemption growth fetched successfully',
        data: res,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message, error.status);
    }
  }

@Post('custom-app')
@ApiConsumes('multipart/form-data')
// @ValidateAdmin()
@ApiBody({
  schema:{
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      logo: {
        type: 'string',
        format: 'binary',
      },
      bannerCard: {
        type: 'string',
        format: 'binary',
      },
      bannerPhoto:{
        type:'string',
        format:'binary',
      }
    }
  }
})
@UseInterceptors(
  FileFieldsInterceptor([
    { name: 'logo', maxCount: 1 },
    { name: 'bannerCard', maxCount: 1 },
    { name: 'bannerPhoto', maxCount: 1 },
  ]),
)
async customYourApp(
  @Body() dto: CreateCustomAppDto,
  @UploadedFiles() files: {
    logo?: Express.Multer.File;
    bannerCard?: Express.Multer.File;
    bannerPhoto?: Express.Multer.File;
  },
) {
  try {
    const res= await this.platformManagementService.customizeApp(dto, files);
    return{
      status:HttpStatus.OK,
      message:'Custom app data saved successfully',
      data:res,
    }
  } catch (error) {
    throw new InternalServerErrorException(error.message);
  }
}

}
