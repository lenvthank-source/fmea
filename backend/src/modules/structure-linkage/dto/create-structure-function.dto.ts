import { IsString, IsOptional, IsUUID, IsIn } from 'class-validator';

export class CreateStructureFunctionDto {
  @IsUUID()
  projectId: string;

  @IsString()
  @IsIn(['project', 'process_step', 'work_element'])
  parentType: string;

  @IsString()
  parentId: string;

  @IsString()
  narration: string;

  @IsOptional()
  @IsString()
  @IsIn(['your_plant', 'ship_to', 'end_user'])
  location?: string;
}
