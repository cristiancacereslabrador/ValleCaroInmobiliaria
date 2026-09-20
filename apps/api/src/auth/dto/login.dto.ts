import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
