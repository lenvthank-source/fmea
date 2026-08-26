import { IsOptional, IsString, IsInt, Min, Max, MaxLength } from 'class-validator';

export class UpdateScaleDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

  @IsOptional()
  @IsString()
  criteria?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;
}
