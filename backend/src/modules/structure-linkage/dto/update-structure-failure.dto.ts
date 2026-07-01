import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class UpdateStructureFailureDto {
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
