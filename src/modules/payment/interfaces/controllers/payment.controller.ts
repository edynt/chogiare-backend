import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { PaymentService } from '@modules/payment/application/services/payment.service';
import { DepositDto } from '@modules/payment/application/dto/deposit.dto';
import { QueryTransactionDto } from '@modules/payment/application/dto/query-transaction.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '@common/decorators/current-user.decorator';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('deposit')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Deposit money to wallet' })
  async deposit(@CurrentUser() user: CurrentUserPayload, @Body() depositDto: DepositDto) {
    return await this.paymentService.deposit(user.id, depositDto);
  }

  @Post('deposit/:id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Confirm a pending bank transfer deposit' })
  @ApiParam({ name: 'id', type: Number })
  async confirmDeposit(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.paymentService.confirmDeposit(user.id, id);
  }

  @Get('balance')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current wallet balance' })
  async getBalance(@CurrentUser() user: CurrentUserPayload) {
    return await this.paymentService.getBalance(user.id);
  }

  @Get('transactions')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get transaction history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['deposit', 'sale', 'refund', 'commission', 'bonus'],
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
  })
  async getTransactions(
    @CurrentUser() user: CurrentUserPayload,
    @Query() queryDto: QueryTransactionDto,
  ) {
    return await this.paymentService.getTransactions(user.id, queryDto);
  }

  @Get('transactions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiParam({ name: 'id', type: Number })
  async getTransaction(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.paymentService.getTransactionById(user.id, id);
  }

  @Get('deposit-packages')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get active deposit packages' })
  async getDepositPackages() {
    return await this.paymentService.getDepositPackages();
  }
}
