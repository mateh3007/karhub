import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { ICreateCompany } from 'src/domain/interfaces/companies/create-company.interface';

export class CreateCompanyDto implements ICreateCompany {
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

  @ApiProperty({ example: 'contato@autopecas.com' })
  @IsEmail()
  contactEmail: string;

  @ApiProperty({ example: '11999999999' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}
