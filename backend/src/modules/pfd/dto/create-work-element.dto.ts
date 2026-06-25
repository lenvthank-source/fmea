import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWorkElementDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
