import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { IJwtPayload } from 'src/domain/interfaces/auth/jwt-payload.interface';
import {
  ILogin,
  ILoginResult,
} from 'src/domain/interfaces/auth/login.interface';
import { UserRepository } from 'src/domain/repositories/user.repository';
import { BaseUsecase } from 'src/shared/bases/base.usecase';

@Injectable()
export class LoginUseCase extends BaseUsecase<ILogin, ILoginResult> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {
    super();
  }

  async execute(data: ILogin): Promise<ILoginResult> {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(data.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: IJwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken };
  }
}
