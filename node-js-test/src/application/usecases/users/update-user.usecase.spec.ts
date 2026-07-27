import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserEntity } from 'src/domain/entities/user.entity';
import { RoleEnum } from 'src/domain/enums/role.enum';
import { UserRepository } from 'src/domain/repositories/user.repository';
import { UpdateUserUseCase } from './update-user.usecase';

function makeExisting(): UserEntity {
  return new UserEntity({
    name: 'Jane Doe',
    email: 'jane@autopecas.com',
    password: 'originalHash',
    role: RoleEnum.USER,
    companyId: 'company-1',
  });
}

describe('UpdateUserUseCase', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: UpdateUserUseCase;

  beforeEach(() => {
    userRepository = {
      findByIdAndCompanyId: jest.fn(),
      findByEmail: jest.fn().mockResolvedValue(null),
      update: jest.fn((user: UserEntity) => Promise.resolve(user)),
    } as unknown as jest.Mocked<UserRepository>;
    useCase = new UpdateUserUseCase(userRepository);
  });

  it('throws NotFoundException when the user does not exist for that company', async () => {
    userRepository.findByIdAndCompanyId.mockResolvedValue(null);

    await expect(
      useCase.execute({
        id: 'missing-id',
        companyId: 'company-1',
        name: 'New Name',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects when the new email already belongs to another user', async () => {
    const existing = makeExisting();
    userRepository.findByIdAndCompanyId.mockResolvedValue(existing);
    userRepository.findByEmail.mockResolvedValue(
      new UserEntity({
        name: 'Someone Else',
        email: 'taken@autopecas.com',
        password: 'hash',
        role: RoleEnum.USER,
        companyId: existing.companyId,
      }),
    );

    await expect(
      useCase.execute({
        id: existing.id,
        companyId: 'company-1',
        email: 'taken@autopecas.com',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('hashes a new password instead of storing it in plain text', async () => {
    const existing = makeExisting();
    userRepository.findByIdAndCompanyId.mockResolvedValue(existing);

    const result = await useCase.execute({
      id: existing.id,
      companyId: 'company-1',
      password: 'newPlainPassword',
    });

    expect(result.password).not.toBe('newPlainPassword');
  });

  it('promotes the role when explicitly requested', async () => {
    const existing = makeExisting();
    userRepository.findByIdAndCompanyId.mockResolvedValue(existing);

    const result = await useCase.execute({
      id: existing.id,
      companyId: 'company-1',
      role: RoleEnum.ADMIN,
    });

    expect(result.role).toBe(RoleEnum.ADMIN);
  });

  it('looks the user up scoped to the given company', async () => {
    const existing = makeExisting();
    userRepository.findByIdAndCompanyId.mockResolvedValue(existing);

    await useCase.execute({
      id: existing.id,
      companyId: 'company-1',
      name: 'New Name',
    });

    expect(userRepository.findByIdAndCompanyId).toHaveBeenCalledWith(
      existing.id,
      'company-1',
    );
  });
});
