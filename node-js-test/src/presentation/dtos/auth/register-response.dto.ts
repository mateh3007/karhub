import { ApiProperty } from '@nestjs/swagger';
import { CompanyResponseDto } from '../companies/company-response.dto';
import { UserResponseDto } from '../users/user-response.dto';

export class RegisterResponseDto {
  @ApiProperty({ type: CompanyResponseDto })
  company: CompanyResponseDto;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
