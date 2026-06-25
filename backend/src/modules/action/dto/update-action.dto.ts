import { IsOptional, IsUUID, IsString, IsIn, IsDateString, IsInt, Min, Max } from 'class-validator';

export class UpdateActionDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  ownerId?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsIn(['open', 'in_progress', 'completed', 'verified', 'closed', 'cancelled'])
  @IsOptional()
  status?: string;

  @IsIn(['high', 'medium', 'low'])
  @IsOptional()
  priority?: string;

  @IsString()
  @IsOptional()
  completionNotes?: string;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  afterSeverity?: number;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  afterOccurrence?: number;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  afterDetection?: number;
}
