import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { RoleEnum } from 'src/domain/enums/role.enum';
import { ICreateUser } from 'src/domain/interfaces/users/create-user.interface';

export class CreateUserDto implements Omit<ICreateUser, 'companyId'> {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'jane.doe@autopecas.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strongPassword123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: RoleEnum, example: RoleEnum.USER })
  @IsEnum(RoleEnum)
  role: RoleEnum;
}
