import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  customer?: string;

  @IsString()
  @IsOptional()
  plantId?: string;

  @IsString()
  @IsOptional()
  productFamilyId?: string;

  @IsString()
  @IsOptional()
  modelYear?: string;
}
