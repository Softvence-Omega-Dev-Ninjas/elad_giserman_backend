import { ValidateAdmin } from '@/common/jwt/jwt.decorator';
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
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { PlatformFilter } from '../dto/getPlatform.dto';
import { UpdateStatusDto } from '../dto/updateStatus.dto';
import { AdminPlatfromManagementService } from '../service/admin.platfromManagement.service';
import { CreateTermsAndConditionsDto, UpdateTermsAndConditionsDto } from '../dto/termAndCondition.dto';
import { dot } from 'node:test/reporters';

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
      console.log(id);
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
      console.log(dto, id);
    } catch (err) {
      throw new HttpException(err.message, err.status);
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
      throw new InternalServerErrorException(error.message, error.status);
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

  @ValidateAdmin()
  @Post('create-termAndCondition')
  @ApiConsumes('multipart/form-data')
  @ApiBody({type:CreateTermsAndConditionsDto})
  async postTermsAndConditions(@Body() dto:CreateTermsAndConditionsDto){
    try{
      const res=await this.platformManagementService.postTermAndConditions(dto)
      return{
        status:HttpStatus.CREATED,
        message:"your platform terms and condition post succesfull",
        data:res
      }
    }catch(error){
      throw new InternalServerErrorException(error.message,error.status)
    }
  }

  @ValidateAdmin()
  @Patch('update-term/:id')
  async updatedTermsAndConditions(@Param('id') id:string,@Body() dto:UpdateTermsAndConditionsDto){
    try{
    const res=await this.platformManagementService.updateTermsAndCondition(id,dto)
    return{
      status:HttpStatus.OK,
      message:"Your term and condition updated successful",
      data:res
    }
    }catch(error){
      throw new InternalServerErrorException(error.message,error.status)
    }
  }


  @Get('get-term')
  async getTermsAndConditions(){
    try{
      const res=await this.platformManagementService.getTermsAndCondition()
      return{
        status:HttpStatus.OK,
        message:"Platform Term and condition fetch succeful",
        data:res
      }
    }catch(error){
      throw new InternalServerErrorException(error.message,error.status)
    }
  }
}
