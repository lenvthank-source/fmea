import { IsOptional, IsUUID, IsInt, IsString, IsIn } from 'class-validator';

export class UpdateCpRowDto {
  @IsUUID()
  @IsOptional()
  characteristicId?: string | null;

  @IsInt()
  @IsOptional()
  rowNumber?: number;

  @IsString()
  @IsOptional()
  specTolerance?: string | null;

  @IsString()
  @IsOptional()
  measurementMethod?: string | null;

  @IsString()
  @IsOptional()
  sampleSize?: string | null;

  @IsString()
  @IsOptional()
  frequency?: string | null;

  @IsIn(['prevention', 'detection'])
  @IsOptional()
  controlType?: string;

  @IsString()
  @IsOptional()
  controlMethod?: string | null;

  @IsString()
  @IsOptional()
  reactionPlan?: string | null;

  @IsString()
  @IsOptional()
  responsible?: string | null;

  @IsString()
  @IsOptional()
  notes?: string | null;
}
