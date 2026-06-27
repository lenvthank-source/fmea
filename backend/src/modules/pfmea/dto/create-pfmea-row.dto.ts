import { IsNotEmpty, IsOptional, IsUUID, IsInt } from 'class-validator';

export class CreatePfmeaRowDto {
  @IsUUID()
  @IsNotEmpty()
  processStepId: string;

  @IsInt()
  @IsNotEmpty()
  rowNumber: number;
}
