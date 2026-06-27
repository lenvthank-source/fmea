import { IsOptional, IsUUID, IsInt, Min, Max, IsString, IsIn, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ControlDto {
  @IsString()
  name: string;

  @IsIn(['prevention', 'detection'])
  type: string;

  @IsString()
  @IsOptional()
  detectionMethod?: string;
}

class CharacteristicDto {
  @IsString()
  name: string;

  @IsIn(['standard', 'special', 'critical', 'safety'])
  classification: string;

  @IsString()
  @IsOptional()
  unitOfMeasure?: string;
}

export class UpdatePfmeaRowDto {
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  severity?: number | null;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  occurrence?: number | null;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  detection?: number | null;

  @IsString()
  @IsOptional()
  notes?: string | null;

  @IsIn(['draft', 'reviewed', 'approved', 'archived'])
  @IsOptional()
  status?: string;

  @IsIn(['public', 'confidential', 'restricted'])
  @IsOptional()
  accessLevel?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  functions?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requirements?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  failureModes?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  effects?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  causes?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ControlDto)
  @IsOptional()
  controls?: ControlDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CharacteristicDto)
  @IsOptional()
  characteristics?: CharacteristicDto[];
}
