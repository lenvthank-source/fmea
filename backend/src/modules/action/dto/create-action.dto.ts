import { IsNotEmpty, IsOptional, IsUUID, IsString, IsIn, IsDateString } from 'class-validator';

export class CreateActionDto {
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsIn(['corrective', 'preventive', 'improvement'])
  @IsOptional()
  actionType?: string;

  @IsUUID()
  @IsNotEmpty()
  ownerId: string;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @IsIn(['high', 'medium', 'low'])
  @IsOptional()
  priority?: string;

  @IsUUID()
  @IsNotEmpty()
  fmeaRowId: string;

  @IsIn(['PFMEA', 'DFMEA'])
  @IsOptional()
  fmeaType?: string;
}
