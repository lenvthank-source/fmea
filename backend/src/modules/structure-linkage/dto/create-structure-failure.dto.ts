import { IsString, IsOptional, IsUUID, IsInt, Min, Max } from 'class-validator';

export class CreateStructureFailureDto {
  @IsUUID()
  functionId: string;

  @IsString()
  narration: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  severityRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  occurrenceRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  detectionRating?: number;

  @IsOptional()
  @IsString()
  currentControlPrevention?: string;

  @IsOptional()
  @IsString()
  currentControlDetection?: string;

  @IsOptional()
  @IsString()
  filterCode?: string;
}
