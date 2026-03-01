import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';
import { SkipHeaderValidation } from '@common/decorators/skip-header-validation.decorator';
import { SepayService } from '@modules/payment/application/services/sepay.service';
import { SepayWebhookDto } from '@modules/payment/application/dto/sepay-webhook.dto';
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY,
} from '@modules/payment/domain/repositories/payment.repository.interface';
import { TRANSACTION_TYPE } from '@common/constants/enum.constants';

@ApiTags('SePay Webhook')
@Controller('payments/sepay')
export class SepayWebhookController {
  private readonly logger = new Logger(SepayWebhookController.name);

  constructor(
    private readonly sepayService: SepayService,
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
  ) {}

  @Post('webhook')
  @Public()
  @SkipHeaderValidation()
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async handleWebhook(
    @Headers('authorization') authHeader: string,
    @Body() payload: SepayWebhookDto,
  ) {
    // Verify API key
    if (!this.sepayService.verifyApiKey(authHeader)) {
      this.logger.warn('SePay webhook: invalid API key');
      throw new UnauthorizedException('Invalid API key');
    }

    // Only process incoming transfers
    if (payload.transferType !== 'in') {
      this.logger.log(`SePay webhook: ignoring outgoing transfer ${payload.id}`);
      return { success: true };
    }

    // Extract transaction ID from transfer content
    const transactionId = this.sepayService.extractTransactionId(payload.content);
    if (!transactionId) {
      this.logger.warn(`SePay webhook: no matching transaction in content "${payload.content}"`);
      return { success: true };
    }

    // Find the pending transaction
    const transaction = await this.paymentRepository.findTransactionById(transactionId);
    if (!transaction) {
      this.logger.warn(`SePay webhook: transaction ${transactionId} not found`);
      return { success: true };
    }

    // Skip if already processed
    if (transaction.status !== 'pending') {
      this.logger.log(`SePay webhook: transaction ${transactionId} already ${transaction.status}`);
      return { success: true };
    }

    // Verify it's a deposit
    if (transaction.type !== TRANSACTION_TYPE.DEPOSIT) {
      this.logger.warn(`SePay webhook: transaction ${transactionId} is not a deposit`);
      return { success: true };
    }

    // Verify amount matches
    if (payload.transferAmount < transaction.amount) {
      this.logger.warn(
        `SePay webhook: amount mismatch for ${transactionId}. Expected ${transaction.amount}, got ${payload.transferAmount}`,
      );
      return { success: true };
    }

    // Atomic: confirm deposit + update balance in single transaction
    try {
      const confirmed = await this.paymentRepository.completeDepositTransaction(
        transactionId,
        transaction.userId,
        transaction.amount,
      );

      if (confirmed) {
        this.logger.log(
          `SePay webhook: deposit ${transactionId} confirmed. User ${transaction.userId} +${transaction.amount} VND. SePay ref: ${payload.referenceCode}`,
        );
      } else {
        this.logger.log(`SePay webhook: deposit ${transactionId} already confirmed (concurrent)`);
      }
    } catch (error) {
      this.logger.error(
        `SePay webhook: failed to process transaction ${transactionId}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Re-throw so SePay retries
      throw error;
    }

    return { success: true };
  }
}
