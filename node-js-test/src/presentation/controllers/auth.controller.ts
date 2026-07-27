import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { LoginUseCase } from 'src/application/usecases/auth/login.usecase';
import { RegisterUseCase } from 'src/application/usecases/auth/register.usecase';
import { CompanyResponseDto } from 'src/presentation/dtos/companies/company-response.dto';
import { LoginDto } from 'src/presentation/dtos/auth/login.dto';
import { LoginResponseDto } from 'src/presentation/dtos/auth/login-response.dto';
import { RegisterDto } from 'src/presentation/dtos/auth/register.dto';
import { RegisterResponseDto } from 'src/presentation/dtos/auth/register-response.dto';
import { UserResponseDto } from 'src/presentation/dtos/users/user-response.dto';

@ApiTags('auth')
@Throttle({ default: { limit: 20, ttl: 60000 } })
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new company and its admin user' })
  @ApiResponse({ status: HttpStatus.CREATED, type: RegisterResponseDto })
  async register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    const { company, user } = await this.registerUseCase.execute(dto);
    return {
      company: CompanyResponseDto.fromEntity(company),
      user: UserResponseDto.fromEntity(user),
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate and receive an access token' })
  @ApiResponse({ status: HttpStatus.OK, type: LoginResponseDto })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.loginUseCase.execute(dto);
  }
}
