import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateStepDto {
  @IsString()
  @IsOptional()
  stepNumber?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @IsIn(['operation', 'inspection', 'transport', 'storage', 'delay', 'rework', 'decision'])
  stepType?: string;

  @IsString()
  @IsOptional()
  inputs?: string;

  @IsString()
  @IsOptional()
  outputs?: string;

  @IsString()
  @IsOptional()
  resources?: string;
}
