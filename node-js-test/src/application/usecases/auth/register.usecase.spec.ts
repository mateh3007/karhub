import { BadRequestException } from '@nestjs/common';
import { CompanyEntity } from 'src/domain/entities/company.entity';
import { UserEntity } from 'src/domain/entities/user.entity';
import { RoleEnum } from 'src/domain/enums/role.enum';
import { CompanyRepository } from 'src/domain/repositories/company.repository';
import { UserRepository } from 'src/domain/repositories/user.repository';
import { RegisterUseCase } from './register.usecase';

function makeInput() {
  return {
    corporateName: 'Auto Pecas LTDA',
    tradeName: 'Auto Pecas',
    cnpj: '12345678000199',
    phone: '11999999999',
    contactEmail: 'admin@autopecas.com',
    adminName: 'Admin Root',
    adminPassword: 'senhaSegura123',
  };
}

describe('RegisterUseCase', () => {
  let companyRepository: jest.Mocked<CompanyRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: RegisterUseCase;

  beforeEach(() => {
    companyRepository = {
      findByCnpj: jest.fn().mockResolvedValue(null),
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn((entity: CompanyEntity) => Promise.resolve(entity)),
    } as unknown as jest.Mocked<CompanyRepository>;
    userRepository = {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn((entity: UserEntity) => Promise.resolve(entity)),
    } as unknown as jest.Mocked<UserRepository>;
    useCase = new RegisterUseCase(companyRepository, userRepository);
  });

  it('creates the company and an ADMIN user whose email matches the company contact email', async () => {
    const result = await useCase.execute(makeInput());

    expect(result.company.contactEmail).toBe('admin@autopecas.com');
    expect(result.user.email).toBe('admin@autopecas.com');
    expect(result.user.role).toBe(RoleEnum.ADMIN);
    expect(result.user.companyId).toBe(result.company.id);
  });

  it('hashes the admin password before persisting the user', async () => {
    const input = makeInput();

    const result = await useCase.execute(input);

    expect(result.user.password).not.toBe(input.adminPassword);
  });

  it('rejects when the cnpj is already registered', async () => {
    companyRepository.findByCnpj.mockResolvedValue(
      new CompanyEntity(makeInput()),
    );

    await expect(useCase.execute(makeInput())).rejects.toThrow(
      BadRequestException,
    );
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it('rejects when the contact email is already registered as a company', async () => {
    companyRepository.findByEmail.mockResolvedValue(
      new CompanyEntity(makeInput()),
    );

    await expect(useCase.execute(makeInput())).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects when the contact email is already registered as a user', async () => {
    userRepository.findByEmail.mockResolvedValue(
      new UserEntity({
        name: 'Someone',
        email: 'admin@autopecas.com',
        password: 'hash',
        role: RoleEnum.ADMIN,
        companyId: 'other-company',
      }),
    );

    await expect(useCase.execute(makeInput())).rejects.toThrow(
      BadRequestException,
    );
    expect(companyRepository.create).not.toHaveBeenCalled();
  });
});
