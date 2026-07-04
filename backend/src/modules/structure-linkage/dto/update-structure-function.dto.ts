import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateStructureFunctionDto {
  @IsOptional()
  @IsString()
  narration?: string;

  @IsOptional()
  @IsString()
  @IsIn(['your_plant', 'ship_to', 'end_user'])
  location?: string;
}
