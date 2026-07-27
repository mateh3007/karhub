import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  MinLength,
} from 'class-validator';
import { IRegister } from 'src/domain/interfaces/auth/register.interface';

export class RegisterDto implements IRegister {
  @ApiProperty({ example: 'Auto Pecas LTDA' })
  @IsString()
  @IsNotEmpty()
  corporateName: string;

  @ApiProperty({ example: 'Auto Pecas' })
  @IsString()
  @IsNotEmpty()
  tradeName: string;

  @ApiProperty({
    example: '12345678000199',
    description: '14-digit CNPJ, digits only',
  })
  @IsString()
  @Length(14, 14)
  cnpj: string;

  @ApiProperty({ example: '11999999999' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    example: 'contato@autopecas.com',
    description: "Also becomes the admin user's login email",
  })
  @IsEmail()
  contactEmail: string;

  @ApiProperty({ example: 'Admin Root' })
  @IsString()
  @IsNotEmpty()
  adminName: string;

  @ApiProperty({ example: 'strongPassword123', minLength: 8 })
  @IsString()
  @MinLength(8)
  adminPassword: string;
}
