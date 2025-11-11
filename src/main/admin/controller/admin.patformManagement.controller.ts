import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Patch, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { AdminPlatfromManagementService } from "../service/admin.platfromManagement.service";
import { ValidateAdmin } from "@/common/jwt/jwt.decorator";
import { PlatformFilter } from "../dto/getPlatform.dto";
import { UpdateStatusDto } from "../dto/updateStatus.dto";


@Controller('platform')
@ApiTags('Platform management')
@ApiBearerAuth()
export class AdminPlatformManagementController {
  constructor(
    private readonly platformManagementService:AdminPlatfromManagementService
  ) {}

  @Get()
  @ValidateAdmin()
  async getPlatformStat(@Query() filter:PlatformFilter) {
    try {
      const res = await this.platformManagementService.getPlatfromStat(filter);
      return {
        status: HttpStatus.OK,
        message: 'Platform stat fetch successful',
        data: res,
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  @Get('user/:id')
  async getUserDetails(@Param('id') id:string){
    try{
        
    }catch(error){
        throw new HttpException(error.message,error.status)
    }
  }


  @ValidateAdmin()
  @Delete('delete-user/:id')
  async deleteUserByAdmin(@Param('id') id:string){
    try{
     return this.platformManagementService.deleteuser(id)
    }catch(error){
        throw new HttpException(error.message,error.status)
    }
  }


  @ValidateAdmin()
  @Patch('update-status/:id')
  @ApiConsumes('multipart/formdata')
  async updateUserStatus(@Body() dto:UpdateStatusDto, @Param('id') id:string){
    try{
        
    }catch(err){
        throw new HttpException(err.message,err.status)
    }
  }
}