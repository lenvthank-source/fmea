import { IsString, IsOptional, IsInt, Min, Max, IsDateString } from 'class-validator';

export class CreateLinkActionDto {
  @IsString()
  description: string;

  @IsOptional()
  @IsDateString()
  targetDate?: string;

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
}
