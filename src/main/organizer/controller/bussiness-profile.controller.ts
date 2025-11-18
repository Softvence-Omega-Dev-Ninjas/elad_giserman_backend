import {
  GetUser,
  ValidateAuth,
  ValidateOrganizer,
} from '@/common/jwt/jwt.decorator';
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
import { CreateOfferDto } from '../dto/create-offer.dto';
import { handleRequest } from '@/common/utils/handle.request';
import { OfferService } from '../service/offer.service';
import { UpdateOfferDto } from '../dto/update-offer.dto';
import { ProfileType } from '@prisma/client';
import { ProfileFilter } from '../dto/getProfileWithFilter.dto';
import { CreateTermsAndConditionsDto } from '@/main/admin/dto/termAndCondition.dto';

@ApiTags('Business Profiles')
@ApiBearerAuth()
@Controller('business-profiles')
export class BusinessProfileController {
  constructor(
    private readonly businessProfileService: BusinessProfileService,
    private readonly offerService: OfferService,
  ) {}

  // get all review
  @ValidateAuth()
  @Get('review/get-all-review')
  async getAllReviews(@GetUser('sub') userId: string) {
    console.log({ userId });
    try {
      const res = await this.businessProfileService.getAllReviews(userId);
      return {
        status: HttpStatus.OK,
        message: 'Reviews fetched successful',
        data: res,
      };
    } catch (err) {
      throw new HttpException(err.message, err.status);
    }
  }

  @ValidateOrganizer()
  @Get('stat')
  async getOrganizationStats(@GetUser('sub') userId: string) {
    try {
      const res =
        await this.businessProfileService.getOrganizationStats(userId);
      return {
        status: HttpStatus.OK,
        message: 'Organization stats fetched successful',
        data: res,
      };
    } catch (err) {
      throw new InternalServerErrorException(err.message, err.status);
    }
  }
  @ValidateOrganizer()
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
        profileType: {
          type: 'string',
          enum: Object.values(ProfileType),
          example: ProfileType.BAR,
        },
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
  @ValidateOrganizer()
  @ApiOperation({ summary: 'Get own Bussiness Profile (only for organizer)' })
  @Get('myBusinessProfile')
  async getBusinessProfile(@GetUser('sub') id: string) {
    return this.businessProfileService.getBusinessProfile(id);
  }

  // user profile update.
  @ValidateOrganizer()
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
        existingImages: {
          type: 'string',
          description: 'JSON array of existing images client wants to keep',
          example: JSON.stringify([
            {
              id: '94abf1c3-6a40-4dcf-bf9e-3a366c124769',
              filename: 'b0192c68-5d4e-4aa6-a0a5-77d8babbd6f2.png',
              originalFilename: 'Screenshot.png',
              path: 'images/b0192c68.png',
              url: 'https://eladserver.s3/.../b0192c68.png',
              fileType: 'image',
              mimeType: 'image/png',
              size: 98623,
            },
          ]),
        },
        profileType: {
          type: 'string',
          enum: Object.values(ProfileType),
          example: ProfileType.BAR,
        },
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

  // create offer...
  @ValidateOrganizer()
  @ApiOperation({
    summary:
      'Create new offer valid organizer who have have bussiness profile (Organizer only)',
  })
  @Post('create-offer')
  @ApiOperation({ summary: 'Organizer creates a new offer (pending approval)' })
  createOffer(@GetUser('sub') userId: string, @Body() dto: CreateOfferDto) {
    return handleRequest(
      () => this.offerService.createOffer(userId, dto),
      'Offer created successfully (pending approval)',
    );
  }

  // get all approvrd offer..
  @ValidateAuth()
  @ApiOperation({ summary: 'Get All Offer those admin has been approved' })
  @Get('approved')
  @ApiOperation({ summary: 'Get all approved offers (user view)' })
  findApproved(@GetUser('sub') userId: string) {
    return handleRequest(
      () => this.offerService.findApprovedOffers(userId),
      'Approved offers fetched successfully',
    );
  }

  // get my created offer
  @ValidateOrganizer()
  @Get('offer/my')
  @ApiOperation({ summary: 'Organizer sees all their offers' })
  findMyOffers(@GetUser('sub') userId: string) {
    return handleRequest(
      () => this.offerService.findMyOffers(userId),
      'My offers fetched successfully',
    );
  }

  //find one offer...
  @ValidateAuth()
  @Get('offer/:id')
  @ApiOperation({ summary: 'Get single offer by ID (User View)' })
  findOne(@GetUser('sub') userId: string, @Param('id') id: string) {
    return handleRequest(
      () => this.offerService.findOne(userId, id),
      'Offer fetched successfully',
    );
  }

  // update offer
  @ValidateOrganizer()
  @Patch('offer/:id')
  @ApiOperation({ summary: 'Organizer updates offer' })
  updateOffer(
    @GetUser('sub') userId: string,
    @Param('id') offerId: string,
    @Body() dto: UpdateOfferDto,
  ) {
    return handleRequest(
      () => this.offerService.updateOffer(userId, offerId, dto),
      'Offer updated successfully',
    );
  }

  // delete offer
  @ValidateOrganizer()
  @Delete('offer/:id')
  @ApiOperation({ summary: 'Organizer deletes offer' })
  deleteOffer(@GetUser('sub') userId: string, @Param('id') offerId: string) {
    return handleRequest(
      () => this.offerService.deleteOffer(userId, offerId),
      'Offer deleted successfully',
    );
  }

  // get all bussinees profile
  @Get('/profile')
  async getAllProfile(@Query() filter: ProfileFilter) {
    try {
      const res = await this.businessProfileService.getAllProfiles(filter);
      return {
        status: HttpStatus.OK,
        message: 'Profile fetched successful',
        data: res,
      };
    } catch (err) {
      throw new HttpException(err.message, err.status);
    }
  }

  // get single review

  @ValidateAuth()
  @Get('review/:id')
  async getSingleReview(@Param('id') id: string) {
    try {
      const res = await this.businessProfileService.getSingleReview(id);
      return {
        status: HttpStatus.OK,
        message: 'Review fetched successful',
        data: res,
      };
    } catch (err) {
      throw new HttpException(err.message, err.status);
    }
  }

  @ValidateOrganizer()
  @Post('create-termsCondition')
  @ApiBody({ type: CreateTermsAndConditionsDto })
  async createPlatformTerm(@Body() dto: CreateTermsAndConditionsDto) {
    try {
      const res =
        await this.businessProfileService.createAdminTermsAdnConditions(dto);
      return {
        status: HttpStatus.OK,
        message: 'Terms and Conditions created successfully',
        data: res,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message, error.status);
    }
  }

  @ValidateOrganizer()
  @Patch('update-termsCondition')
  @ApiBody({ type: CreateTermsAndConditionsDto })
  async updatePlatformTerm(@Body() dto: CreateTermsAndConditionsDto) {
    try {
      const res =
        await this.businessProfileService.updateAdminTermsAndConditions(dto);
      return {
        status: HttpStatus.OK,
        message: 'Terms and Conditions updated successfully',
        data: res,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message, error.status);
    }
  }

  @Get('organizer/terms-conditions')
  async getTermsAndConditions() {
    try {
      const res = await this.businessProfileService.getTemsAndConditions();
      return {
        status: HttpStatus.OK,
        message: 'Terms and Conditions fetched successfully',
        data: res,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message, error.status);
    }
  }
}
