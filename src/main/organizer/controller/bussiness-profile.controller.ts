import { GetUser, ValidateOrganizer } from '@/common/jwt/jwt.decorator';
import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateBusinessProfileDto } from '../dto/create-bussiness-profile.dto';
import { BusinessProfileService } from '../service/bussiness-profile.service';
import { UpdateBusinessProfileDto } from '../dto/update-bussiness-profile.dto';

@ApiTags('Business Profiles')
@ApiBearerAuth()
@ValidateOrganizer()
@Controller('business-profiles')
export class BusinessProfileController {
  constructor(
    private readonly businessProfileService: BusinessProfileService,
  ) {}

  @ApiOperation({
    summary: 'Create New Bussiness Profile (only for organizer)',
  })
  @Post('/create-profile')
  @UseInterceptors(FilesInterceptor('gallery', 10)) // Accept up to 10 files
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Create business profile with gallery uploads',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'The Coffee Spot' },
        description: { type: 'string', example: 'Cozy cafe serving coffee' },
        location: { type: 'string', example: 'Banani, Dhaka' },
        openingTime: { type: 'string', example: '08:00 AM' },
        closingTime: { type: 'string', example: '10:00 PM' },
        gallery: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Upload up to 10 images for gallery',
        },
      },
    },
  })
  // create bussiness profile
  async create(
    @GetUser('sub') id: string,
    @Body() dto: CreateBusinessProfileDto,
    @UploadedFiles() gallery: Express.Multer.File[],
  ) {
    return this.businessProfileService.create(id, dto, gallery);
  }

  // get business Profile
  @ApiOperation({ summary: 'Get own Bussiness Profile (only for organizer)' })
  @Get('myBusinessProfile')
  async getBusinessProfile(@GetUser('sub') id: string) {
    return this.businessProfileService.getBusinessProfile(id);
  }

  // user profile update.
  @ApiOperation({
    summary: 'Update existing Business Profile (Organizer only)',
  })
  @Patch('/update-profile')
  @UseInterceptors(FilesInterceptor('gallery', 10))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Update business profile with optional new gallery images',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Updated Coffee Spot' },
        description: { type: 'string', example: 'Now with new pastries!' },
        location: { type: 'string', example: 'Banani, Dhaka' },
        openingTime: { type: 'string', example: '09:00 AM' },
        closingTime: { type: 'string', example: '11:00 PM' },
        isActive: { type: 'boolean', example: true },
        gallery: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Upload up to 10 new images for the gallery',
        },
      },
    },
  })
  async update(
    @GetUser('sub') id: string,
    @Body() dto: UpdateBusinessProfileDto,
    @UploadedFiles() gallery: Express.Multer.File[],
  ) {
    return this.businessProfileService.update(id, dto, gallery);
  }
}
