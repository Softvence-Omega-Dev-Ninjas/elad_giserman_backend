import { ValidateAdmin } from '@/common/jwt/jwt.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PlatformFilter } from '../dto/getPlatform.dto';
import { AdminPlatfromManagementService } from '../service/admin.platfromManagement.service';

import { extractLastLine } from '@/lib/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CreateCustomAppDto } from '../dto/customApp.dto';
import { GetOffersDto } from '../dto/getOffer.dto';
import { GetRedemtionsDto } from '../dto/getRedemtion.dto';
import { GetUserDto } from '../dto/getuser.dto';
import { CreateSpinDto, UpdateSpinDto } from '../dto/spin.dto';
import { CreateTermsAndConditionsDto } from '../dto/termAndCondition.dto';
import { UpdateStatusDto } from '../dto/updateStatus.dto';
import { ReservationFilter } from '@/main/organizer/dto/getReservation.dto';

@Controller('platform')
@ApiTags('Platform management')
@ApiBearerAuth()
export class AdminPlatformManagementController {
  private readonly logger = new Logger(AdminPlatformManagementController.name);

  constructor(
    private readonly platformManagementService: AdminPlatfromManagementService,
  ) {}

  @Get()
  // @ValidateAdmin()
  async getPlatformStat(@Query() filter: PlatformFilter) {
    try {
      const res = await this.platformManagementService.getPlatfromStat(filter);
      return {
        status: HttpStatus.OK,
        message: 'Platform stat fetch successful',
        data: res,
      };
    } catch (error) {
      const message = extractLastLine(error.message);
      this.logger.error(`Faild to save spin data`, error.stack);
      throw new InternalServerErrorException(message);
    }
  }

  @Get('user/:id')
  async getUserDetails(@Param('id') id: string) {
    try {
      console.log(id);
    } catch (error) {
      const message = extractLastLine(error.message);
      this.logger.error(`Faild to delete user by ID=${id}`, error.stack);
      throw new InternalServerErrorException(message);
    }
  }

  @ValidateAdmin()
  @Delete('delete-user/:id')
  async deleteUserByAdmin(@Param('id') id: string) {
    try {
      return this.platformManagementService.deleteuser(id);
    } catch (error) {
      const message = extractLastLine(error.message);
      this.logger.error(`Faild to delete user by ID=${id}`, error.stack);
      throw new InternalServerErrorException(message);
    }
  }

  @ValidateAdmin()
  @Patch('update-status/:id')
  // @ApiConsumes('multipart/formdata')
  async updateUserStatus(
    @Body() dto: UpdateStatusDto,
    @Param('id') id: string,
  ) {
    try {
      const res = await this.platformManagementService.UpdateUserStatus(
        dto,
        id,
      );
      return {
        status: HttpStatus.OK,
        message: 'User status updated successfully',
        data: res,
      };
    } catch (error) {
      const message = extractLastLine(error.message);
      this.logger.error(`Faild to Update by ID=${id}`, error.stack);
      throw new InternalServerErrorException(message);
    }
  }

  @ValidateAdmin()
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
      const message = extractLastLine(error.message);
      this.logger.error(`Faild fetch growth`, error.stack);
      throw new InternalServerErrorException(message);
    }
  }

  @ValidateAdmin()
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
  @ValidateAdmin()
  @ApiBody({
    schema: {
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
        bannerPhoto: {
          type: 'string',
          format: 'binary',
        },
      },
    },
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
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File;
      bannerCard?: Express.Multer.File;
      bannerPhoto?: Express.Multer.File;
    },
  ) {
    try {
      const res = await this.platformManagementService.customizeApp(dto, files);
      return {
        status: HttpStatus.OK,
        message: 'Custom app data saved successfully',
        data: res,
      };
    } catch (error) {
      const message = extractLastLine(error.message);
      this.logger.error(`Faild to save custom app data`, error.stack);
      throw new InternalServerErrorException(message);
    }
  }

  @Post('create-spin-table')
  @ApiBody({ type: CreateSpinDto })
  async createSpin(@Body() dto: CreateSpinDto) {
    try {
      const res = await this.platformManagementService.createSpinTable(dto);
      return {
        status: HttpStatus.OK,
        message: 'Spin data set successfully',
        data: res,
      };
    } catch (error) {
      const message = extractLastLine(error.message);
      this.logger.error(`Faild to save spin data`, error.stack);
      throw new InternalServerErrorException(message);
    }
  }

  @Patch('update-spin/:id')
  @ApiOperation({ summary: 'Updated spin value by ID' })
  @ApiBody({ type: UpdateSpinDto })
  async updateSpin(@Param('id') id: string, @Body() dto: UpdateSpinDto) {
    try {
      const res = await this.platformManagementService.updateSpinData(dto, id);
      return {
        status: HttpStatus.OK,
        message: 'Spin value updated successfully',
        data: res,
      };
    } catch (error) {
      const message = extractLastLine(error.message);
      this.logger.error(`Faild to Updated spin value id=${id}`, error.stack);
      throw new InternalServerErrorException(message);
    }
  }

  @Get('spin-table')
  @ApiOperation({ summary: 'Get all spin data' })
  async getSpinTable() {
    try {
      const res = await this.platformManagementService.getSpinTableData();
      return {
        status: HttpStatus.OK,
        message: 'Spin data fetched successfully',
        data: res,
      };
    } catch (error) {
      const message = extractLastLine(error.message);
      this.logger.error(`Faild to save spin data`, error.stack);
      throw new InternalServerErrorException(message);
    }
  }

  @ValidateAdmin()
  @Delete('delete-spin/:id')
  @ApiOperation({ summary: 'Delete spin data by ID' })
  async deleteSpin(@Param('id') id: string) {
    try {
      const res = await this.platformManagementService.deleteSpin(id);
      return res;
    } catch (error) {
      const message = extractLastLine(error.message);
      this.logger.error(`Faild to Delete spin data`, error.stack);
      throw new InternalServerErrorException(message);
    }
  }

  @ValidateAdmin()
  @Post('create-termsCondition')
  @ApiBody({ type: CreateTermsAndConditionsDto })
  async createPlatformTerm(@Body() dto: CreateTermsAndConditionsDto) {
    try {
      const res =
        await this.platformManagementService.createAdminTermsAdnConditions(dto);
      return {
        status: HttpStatus.OK,
        message: 'Terms and Conditions created successfully',
        data: res,
      };
    } catch (error) {
      const message = extractLastLine(error.message);
      this.logger.error(`Faild to save spin data`, error.stack);
      throw new InternalServerErrorException(message);
    }
  }

  @ValidateAdmin()
  @Patch('update-termsCondition')
  @ApiBody({ type: CreateTermsAndConditionsDto })
  async updatePlatformTerm(@Body() dto: CreateTermsAndConditionsDto) {
    try {
      const res =
        await this.platformManagementService.updateAdminTermsAndConditions(dto);
      return {
        status: HttpStatus.OK,
        message: 'Terms and Conditions updated successfully',
        data: res,
      };
    } catch (error) {
      const message = extractLastLine(error.message);
      this.logger.error(`Faild to save spin data`, error.stack);
      throw new InternalServerErrorException(message);
    }
  }

  @Get('terms-conditions')
  async getTermsAndConditions() {
    try {
      const res = await this.platformManagementService.getTemsAndConditions();
      return {
        status: HttpStatus.OK,
        message: 'Terms and Conditions fetched successfully',
        data: res,
      };
    } catch (error) {
      const message = extractLastLine(error.message);
      this.logger.error(`Faild to save spin data`, error.stack);
      throw new InternalServerErrorException(message);
    }
  }

  @Get('get-alluser')
  async getAllUser(@Query() query: GetUserDto) {
    // Convert query params with defaults
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 10;
    const search = query.search || '';
    const status = query.status || '';
    // Call service to get users
    const users = await this.platformManagementService.getAllUsers({
      page,
      limit,
      search,
      status,
    });

    return {
      status: 'success',
      page,
      limit,
      total: users.total,
      data: users.data,
    };
  }

  @Get('offer/redemtions')
  async getAllRedemtions(@Query() query: GetRedemtionsDto) {
    // Convert query params with defaults
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 10;

    // Call service to get users
    const users = await this.platformManagementService.getAlRedemtions({
      page,
      limit,
    });

    return {
      status: 'success',
      page,
      limit,
      data: users.data,
    };
  }

  @Get('subscription/payment-log')
  async getPaymentLog(@Query() filter: GetOffersDto) {
    try {
      const res = await this.platformManagementService.getPaymentLog(filter);
      return {
        status: HttpStatus.OK,
        message: 'Payment log fetched successfully',
        data: res,
      };
    } catch (error) {
      const message = extractLastLine(error.message);
      this.logger.error(`Faild to save spin data`, error.stack);
      throw new InternalServerErrorException(message);
    }
  }

  @Get('spin/spin-history')
  async getSpinHistory(@Query() dto: GetOffersDto) {
    try {
      const res = await this.platformManagementService.getSpinHistory(dto);
      return {
        status: HttpStatus.OK,
        message: 'Spin history fetched successfully',
        data: res,
      };
    } catch (error) {
      const message = extractLastLine(error.message);
      this.logger.error(`Faild to save spin data`, error.stack);
      throw new InternalServerErrorException(message);
    }
  }

  @Get('customAppDetails')
  async getCustomAppDetails() {
    try {
      const res = await this.platformManagementService.getCustomAppDetails();
      return {
        status: HttpStatus.OK,
        message: 'Custom app details fetched successfully',
        data: res,
      };
    } catch (error) {
      const message = extractLastLine(error.message);
      this.logger.error(`Faild to save spin data`, error.stack);
      throw new InternalServerErrorException(message);
    }
  }

  @Get('all-reservation')
  async getAllReservation(@Query() filter: ReservationFilter) {
    try {
      const res =
        await this.platformManagementService.getAllReservation(filter);
      return {
        status: HttpStatus.OK,
        message: 'Reservation fetched successfully',
        data: res,
      };
    } catch (error) {
      const message = extractLastLine(error.message);
      this.logger.error(`Faild to save spin data`, error.stack);
      throw new InternalServerErrorException(message);
    }
  }

  @Patch('demo-premiun/:id')
  @ApiOperation({ summary: 'JUST FOR test user will be make premium' })
  async makeDemoPremium(@Param('id') id: string) {
    try {
      const res = await this.platformManagementService.makeDemoPremium(id);
      return {
        status: HttpStatus.OK,
        message: 'User updated successfully',
        data: res,
      };
    } catch (error) {
      const message = extractLastLine(error.message);
      this.logger.error(`Faild to save spin data`, error.stack);
      throw new InternalServerErrorException(message);
    }
  }
}
