import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePaymentStatusDto {
  @ApiProperty({
    description: 'Payment status',
    example: 'completed',
  })
  @IsNotEmpty()
  @IsString()
  paymentStatus: string;

  @ApiPropertyOptional({
    description: 'Payment proof image URL',
    example: 'https://storage.example.com/payment-proof.jpg',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  paymentProofUrl?: string;
}
