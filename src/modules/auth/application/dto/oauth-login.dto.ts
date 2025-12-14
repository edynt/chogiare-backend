import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class OAuthLoginDto {
  @ApiProperty({
    description: 'OAuth access token from provider',
    example: 'ya29.a0AfH6SMBx...',
  })
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.IS_NOT_EMPTY })
  accessToken: string;

  @ApiProperty({
    description: 'OAuth provider ID (optional, for additional verification)',
    example: '123456789',
    required: false,
  })
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  providerId?: string;
}


