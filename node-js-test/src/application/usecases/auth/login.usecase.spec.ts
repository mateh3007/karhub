import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from 'src/domain/entities/user.entity';
import { RoleEnum } from 'src/domain/enums/role.enum';
import { UserRepository } from 'src/domain/repositories/user.repository';
import { LoginUseCase } from './login.usecase';

describe('LoginUseCase', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let useCase: LoginUseCase;

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed.jwt.token'),
    } as unknown as jest.Mocked<JwtService>;
    useCase = new LoginUseCase(userRepository, jwtService);
  });

  it('throws UnauthorizedException when no user exists for the email', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'missing@autopecas.com', password: 'any' }),
    ).rejects.toThrow(UnauthorizedException);
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when the password does not match', async () => {
    const user = new UserEntity({
      name: 'Admin',
      email: 'admin@autopecas.com',
      password: await bcrypt.hash('correctPassword', 10),
      role: RoleEnum.ADMIN,
      companyId: 'company-1',
    });
    userRepository.findByEmail.mockResolvedValue(user);

    await expect(
      useCase.execute({ email: user.email, password: 'wrongPassword' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('uses the same error message for a missing user and a wrong password, to avoid user enumeration', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    let messageForMissingUser = '';
    try {
      await useCase.execute({
        email: 'missing@autopecas.com',
        password: 'any',
      });
    } catch (error) {
      messageForMissingUser = (error as UnauthorizedException).message;
    }

    const user = new UserEntity({
      name: 'Admin',
      email: 'admin@autopecas.com',
      password: await bcrypt.hash('correctPassword', 10),
      role: RoleEnum.ADMIN,
      companyId: 'company-1',
    });
    userRepository.findByEmail.mockResolvedValue(user);
    let messageForWrongPassword = '';
    try {
      await useCase.execute({ email: user.email, password: 'wrongPassword' });
    } catch (error) {
      messageForWrongPassword = (error as UnauthorizedException).message;
    }

    expect(messageForMissingUser).toBe(messageForWrongPassword);
  });

  it("signs and returns a JWT with the user's identity when credentials are valid", async () => {
    const user = new UserEntity({
      name: 'Admin',
      email: 'admin@autopecas.com',
      password: await bcrypt.hash('correctPassword', 10),
      role: RoleEnum.ADMIN,
      companyId: 'company-1',
    });
    userRepository.findByEmail.mockResolvedValue(user);

    const result = await useCase.execute({
      email: user.email,
      password: 'correctPassword',
    });

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    });
    expect(result).toEqual({ accessToken: 'signed.jwt.token' });
  });
});
