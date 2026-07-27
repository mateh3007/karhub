import { NotFoundException } from '@nestjs/common';
import { UserEntity } from 'src/domain/entities/user.entity';
import { RoleEnum } from 'src/domain/enums/role.enum';
import { UserRepository } from 'src/domain/repositories/user.repository';
import { GetUserByIdUseCase } from './get-user-by-id.usecase';

describe('GetUserByIdUseCase', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: GetUserByIdUseCase;

  beforeEach(() => {
    userRepository = {
      findByIdAndCompanyId: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;
    useCase = new GetUserByIdUseCase(userRepository);
  });

  it('returns the user when it belongs to the given company', async () => {
    const user = new UserEntity({
      name: 'Jane Doe',
      email: 'jane@autopecas.com',
      password: 'hash',
      role: RoleEnum.USER,
      companyId: 'company-1',
    });
    userRepository.findByIdAndCompanyId.mockResolvedValue(user);

    const result = await useCase.execute({
      id: user.id,
      companyId: 'company-1',
    });

    expect(userRepository.findByIdAndCompanyId).toHaveBeenCalledWith(
      user.id,
      'company-1',
    );
    expect(result).toBe(user);
  });

  it('throws NotFoundException when the user does not exist for that company', async () => {
    userRepository.findByIdAndCompanyId.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 'missing-id', companyId: 'company-1' }),
    ).rejects.toThrow(NotFoundException);
  });
});
