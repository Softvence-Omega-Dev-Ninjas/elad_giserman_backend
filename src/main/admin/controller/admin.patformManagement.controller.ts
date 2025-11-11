import { Controller, Get, HttpException, HttpStatus, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AdminPlatfromManagementService } from "../service/admin.platfromManagement.service";
import { ValidateAdmin } from "@/common/jwt/jwt.decorator";
import { PlatformFilter } from "../dto/getPlatform.dto";


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
}