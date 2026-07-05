import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password?: string;

  @IsNotEmpty()
  subdomain: string;

  @IsOptional()
  @IsString()
  name?: string;
}
