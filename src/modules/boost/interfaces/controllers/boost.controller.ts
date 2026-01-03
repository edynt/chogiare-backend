import { Controller, Get, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BoostService } from '@modules/boost/application/services/boost.service';
import { CreateBoostDto } from '@modules/boost/application/dto/create-boost.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '@common/decorators/current-user.decorator';
import { MESSAGES } from '@common/constants/messages.constants';

@ApiTags('Boost')
@Controller('boost')
@UseGuards(JwtAuthGuard)
export class BoostController {
  constructor(private readonly boostService: BoostService) {}

  @Get('packages')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get available boost packages' })
  async getBoostPackages() {
    return await this.boostService.getBoostPackages();
  }

  @Post('product')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Boost a product using wallet balance' })
  async createBoost(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createBoostDto: CreateBoostDto,
  ) {
    const boost = await this.boostService.createBoost(user.id, createBoostDto);
    return {
      message: MESSAGES.BOOST.BOOST_CREATED,
      data: boost,
    };
  }

  @Get('my-boosts')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my boost history' })
  async getUserBoosts(@CurrentUser() user: CurrentUserPayload) {
    return await this.boostService.getUserBoosts(user.id);
  }
}
