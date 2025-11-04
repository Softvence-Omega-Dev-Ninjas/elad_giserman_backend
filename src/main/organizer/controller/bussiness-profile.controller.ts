import {
  Body,
  Controller,
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

@ApiTags('Business Profiles')
@Controller('business-profiles')
export class BusinessProfileController {
  constructor(
    private readonly businessProfileService: BusinessProfileService,
  ) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create New Bussiness Profile' })
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
        ownerId: {
          type: 'string',
          example: 'a4b3c4e2-d3f6-4b72-83a9-6b8b0adfa123',
        },
        gallery: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Upload up to 10 images for gallery',
        },
      },
    },
  })
  async create(
    @Body() createBusinessProfileDto: CreateBusinessProfileDto,
    @UploadedFiles() gallery: Express.Multer.File[],
  ) {
    return this.businessProfileService.create(
      createBusinessProfileDto,
      gallery,
    );
  }
}
