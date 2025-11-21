import { ValidateAdmin } from '@/common/jwt/jwt.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
} from './dto/create-plan.dto';
import { GetAllPlansDto } from './dto/plan.dto';
import { SubscriptionService } from './services/subscription.service';
import { UpdatePlanService } from './services/update-plan.service';

@ApiTags('Admin -- Subscription')
@ApiBearerAuth()
@ValidateAdmin()
@Controller('admin/subscription')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly updatePlanService: UpdatePlanService,
  ) {}

  @ApiOperation({ summary: 'Create a new plan' })
  @Post('plan')
  async createNewPlan(@Body() dto: CreateSubscriptionPlanDto) {
    return this.subscriptionService.createNewPlan(dto);
  }
  @Patch('subscription/:id')
  async updateSubscriptionPlan(@Param('id') id: string) {
    try {
      const res = await this.subscriptionService.upatePlan(id);
      return {
        status: HttpStatus.OK,
        message: 'Subscription plan updated successfully',
        data: res,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message, error.status);
    }
  }
  @ApiOperation({ summary: 'Get all plans' })
  @Get('plans')
  async getPlans(@Query() query: GetAllPlansDto) {
    return this.subscriptionService.getPlans(query);
  }

  @ApiOperation({ summary: 'Get a single plan' })
  @Get('plans/:planId')
  async getASinglePlan(@Param('planId') planId: string) {
    return this.subscriptionService.getASinglePlan(planId);
  }

  @ApiOperation({ summary: 'Delete a plan' })
  @Delete('plans/:planId')
  async deletePlan(@Param('planId') planId: string) {
    return this.subscriptionService.deletePlan(planId);
  }

  @ApiOperation({ summary: 'Update a plan' })
  @Post('plans/:planId')
  async updateAPlan(
    @Param('planId') planId: string,
    @Body() dto: UpdateSubscriptionPlanDto,
  ) {
    return this.updatePlanService.updatePlan(planId, dto);
  }
}
