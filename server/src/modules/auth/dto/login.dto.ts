import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Trim } from '../../../common/validation';

export class LoginDto {
  @Trim()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
