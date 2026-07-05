import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsNotEmpty()
  subdomain: string;

  @IsOptional()
  @IsString()
  name?: string;
}
