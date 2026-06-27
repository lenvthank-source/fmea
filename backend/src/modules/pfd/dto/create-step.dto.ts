import { IsIn, IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';

export class CreateStepDto {
  @IsString()
  @IsNotEmpty()
  stepNumber: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['operation', 'inspection', 'transport', 'storage', 'delay', 'rework', 'decision'])
  stepType: string;

  @IsString()
  @IsOptional()
  inputs?: string;

  @IsString()
  @IsOptional()
  outputs?: string;

  @IsString()
  @IsOptional()
  resources?: string;

  @IsString()
  @IsOptional()
  processItemId?: string;

  @IsString()
  @IsOptional()
  incomingVariation?: string;

  @IsString()
  @IsOptional()
  specialCharacteristics?: string;

  @IsObject()
  @IsOptional()
  flowIcons?: any;

  @IsString()
  @IsOptional()
  machinesEquipmentDocs?: string;

  @IsString()
  @IsOptional()
  desiredOutcome?: string;

  @IsString()
  @IsOptional()
  processCharacteristics?: string;
}
