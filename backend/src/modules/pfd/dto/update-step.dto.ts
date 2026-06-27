import { IsIn, IsOptional, IsString, IsObject } from 'class-validator';

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

  @IsOptional()
  incomingVariation?: any;

  @IsString()
  @IsOptional()
  specialCharacteristics?: string;

  @IsObject()
  @IsOptional()
  flowIcons?: any;

  @IsOptional()
  machinesEquipmentDocs?: any;

  @IsString()
  @IsOptional()
  desiredOutcome?: string;

  @IsString()
  @IsOptional()
  processCharacteristics?: string;
}
