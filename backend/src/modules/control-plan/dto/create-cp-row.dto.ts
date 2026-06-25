import { IsNotEmpty, IsOptional, IsUUID, IsInt, IsString, IsIn } from 'class-validator';

export class CreateCpRowDto {
  @IsUUID()
  @IsNotEmpty()
  processStepId: string;

  @IsUUID()
  @IsOptional()
  characteristicId?: string;

  @IsInt()
  @IsNotEmpty()
  rowNumber: number;

  @IsString()
  @IsOptional()
  specTolerance?: string;

  @IsString()
  @IsOptional()
  measurementMethod?: string;

  @IsString()
  @IsOptional()
  sampleSize?: string;

  @IsString()
  @IsOptional()
  frequency?: string;

  @IsIn(['prevention', 'detection'])
  @IsNotEmpty()
  controlType: string;

  @IsString()
  @IsOptional()
  controlMethod?: string;

  @IsString()
  @IsOptional()
  reactionPlan?: string;

  @IsString()
  @IsOptional()
  responsible?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
