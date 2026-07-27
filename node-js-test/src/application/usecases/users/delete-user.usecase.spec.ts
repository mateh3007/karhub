import { NotFoundException } from '@nestjs/common';
import { UserEntity } from 'src/domain/entities/user.entity';
import { RoleEnum } from 'src/domain/enums/role.enum';
import { UserRepository } from 'src/domain/repositories/user.repository';
import { DeleteUserUseCase } from './delete-user.usecase';

describe('DeleteUserUseCase', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: DeleteUserUseCase;

  beforeEach(() => {
    userRepository = {
      findByIdAndCompanyId: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;
    useCase = new DeleteUserUseCase(userRepository);
  });

  it('throws NotFoundException when the user does not exist for that company', async () => {
    userRepository.findByIdAndCompanyId.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 'missing-id', companyId: 'company-1' }),
    ).rejects.toThrow(NotFoundException);
    expect(userRepository.delete).not.toHaveBeenCalled();
  });

  it('deletes the user when it belongs to the given company', async () => {
    const user = new UserEntity({
      name: 'Jane Doe',
      email: 'jane@autopecas.com',
      password: 'hash',
      role: RoleEnum.USER,
      companyId: 'company-1',
    });
    userRepository.findByIdAndCompanyId.mockResolvedValue(user);

    await useCase.execute({ id: user.id, companyId: 'company-1' });

    expect(userRepository.findByIdAndCompanyId).toHaveBeenCalledWith(
      user.id,
      'company-1',
    );
    expect(userRepository.delete).toHaveBeenCalledWith(user.id);
  });
});
