import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ILogin } from 'src/domain/interfaces/auth/login.interface';

export class LoginDto implements ILogin {
  @ApiProperty({ example: 'contato@autopecas.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strongPassword123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
