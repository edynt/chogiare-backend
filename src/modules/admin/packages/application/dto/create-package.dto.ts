import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, Min } from 'class-validator';

export class CreatePackageDto {
  @IsString()
  name: string;

  @IsString()
  displayName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(1)
  durationDays: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  metadata?: Record<string, any>;
}
