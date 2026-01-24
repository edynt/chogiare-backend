import { IsInt, Min } from 'class-validator';

export class BoostProductDto {
  @IsInt()
  @Min(1)
  packageId: number;
}
