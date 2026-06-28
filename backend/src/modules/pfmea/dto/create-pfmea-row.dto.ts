import { IsNotEmpty, IsOptional, IsUUID, IsInt, IsString } from 'class-validator';

export class CreatePfmeaRowDto {
  @IsUUID()
  @IsOptional()
  processStepId?: string;

  @IsString()
  @IsOptional()
  workElementName?: string;

  @IsInt()
  @IsNotEmpty()
  rowNumber: number;
}
