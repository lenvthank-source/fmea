import { IsArray, IsIn, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ImportPfmeaRowItemDto {
  @IsString()
  @IsOptional()
  processStep?: string;

  @IsString()
  @IsOptional()
  workElementName?: string;

  @IsString()
  @IsOptional()
  function?: string;

  @IsString()
  @IsOptional()
  failureMode?: string;

  @IsString()
  @IsOptional()
  failureEffect?: string;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  severity?: number | null;

  @IsString()
  @IsOptional()
  failureCause?: string;

  @IsString()
  @IsOptional()
  preventionControl?: string;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  occurrence?: number | null;

  @IsString()
  @IsOptional()
  detectionControl?: string;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  detection?: number | null;

  @IsString()
  @IsOptional()
  ap?: string | null;

  @IsString()
  @IsOptional()
  filterCode?: string | null;

  @IsString()
  @IsOptional()
  preventionAction?: string | null;

  @IsString()
  @IsOptional()
  detectionAction?: string | null;

  @IsString()
  @IsOptional()
  responsibility?: string | null;

  @IsString()
  @IsOptional()
  targetDate?: string | null;

  @IsString()
  @IsOptional()
  actionTaken?: string | null;

  @IsString()
  @IsOptional()
  completionDate?: string | null;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  revisedSeverity?: number | null;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  revisedOccurrence?: number | null;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  revisedDetection?: number | null;

  @IsString()
  @IsOptional()
  revisedAp?: string | null;

  @IsString()
  @IsOptional()
  status?: string | null;

  @IsString()
  @IsOptional()
  notes?: string | null;
}

export class ImportPfmeaPayloadDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportPfmeaRowItemDto)
  rows: ImportPfmeaRowItemDto[];

  @IsIn(['build', 'update'])
  @IsOptional()
  mode?: 'build' | 'update';
}
