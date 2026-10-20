import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
} from 'class-validator';

export class CreateStepDto {
  @IsString()
  @IsOptional()
  stepNumber?: string;

  @IsString()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsIn([
    'operation',
    'inspection',
    'transport',
    'storage',
    'delay',
    'rework',
    'repair',
    'decision',
    'combined',
    'hold',
    'scrap',
    'return',
  ])
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

  @IsOptional()
  incomingVariation?: any;

  @IsString()
  @IsOptional()
  specialCharacteristics?: string;

  @IsObject()
  @IsOptional()
  flowIcons?: any;

  @IsString()
  @IsOptional()
  manufacturingSymbolId?: string | null;

  @IsString()
  @IsOptional()
  engineeringSymbolId?: string | null;

  @IsOptional()
  machinesEquipmentDocs?: any;

  @IsString()
  @IsOptional()
  desiredOutcome?: string;

  @IsString()
  @IsOptional()
  processCharacteristics?: string;
}
