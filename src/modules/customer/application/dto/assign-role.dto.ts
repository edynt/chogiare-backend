import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class AssignRoleDto {
  @ApiProperty({
    description: 'Role name',
    example: 'seller',
    maxLength: 50,
  })
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.IS_NOT_EMPTY })
  @MaxLength(50, { message: VALIDATION_MESSAGES.MAX_LENGTH(50) })
  roleName: string;
}
