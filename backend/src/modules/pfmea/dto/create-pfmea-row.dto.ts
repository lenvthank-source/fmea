import { IsNotEmpty, IsOptional, IsUUID, IsInt } from 'class-validator';

export class CreatePfmeaRowDto {
  @IsUUID()
  @IsNotEmpty()
  processStepId: string;

  @IsUUID()
  @IsOptional()
  workElementId?: string;

  @IsInt()
  @IsNotEmpty()
  rowNumber: number;
}
