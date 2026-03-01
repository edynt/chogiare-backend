import { IsNumber, IsString, IsOptional, IsNotEmpty, Min } from 'class-validator';

/**
 * SePay webhook payload for bank transfer notifications.
 * Sent by SePay when a bank transfer is detected.
 */
export class SepayWebhookDto {
  @IsNumber()
  id: number;

  @IsString()
  @IsNotEmpty()
  gateway: string;

  @IsString()
  @IsNotEmpty()
  transactionDate: string;

  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @IsOptional()
  @IsString()
  code: string | null;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  transferType: string;

  @IsNumber()
  @Min(1)
  transferAmount: number;

  @IsNumber()
  accumulated: number;

  @IsOptional()
  @IsString()
  subAccount: string | null;

  @IsOptional()
  @IsString()
  referenceCode: string;

  @IsOptional()
  @IsString()
  description: string;
}
