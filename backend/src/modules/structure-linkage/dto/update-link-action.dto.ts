import { IsString, IsOptional, IsInt, Min, Max, IsDateString } from 'class-validator';

export class UpdateLinkActionDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  preventionAction?: string;

  @IsOptional()
  @IsString()
  detectionAction?: string;

  @IsOptional()
  @IsString()
  actionTaken?: string;

  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @IsOptional()
  @IsDateString()
  completionDate?: string;

  @IsOptional()
  @IsString()
  responsiblePerson?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  revisedSeverity?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  revisedOccurrence?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  revisedDetection?: number;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
