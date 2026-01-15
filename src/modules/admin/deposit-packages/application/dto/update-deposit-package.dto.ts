import { PartialType } from '@nestjs/mapped-types';
import { CreateDepositPackageDto } from './create-deposit-package.dto';

export class UpdateDepositPackageDto extends PartialType(CreateDepositPackageDto) {}
