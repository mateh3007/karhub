import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CompanyEntity } from 'src/domain/entities/company.entity';
import { UserEntity } from 'src/domain/entities/user.entity';
import { RoleEnum } from 'src/domain/enums/role.enum';
import { CompanyRepository } from 'src/domain/repositories/company.repository';
import { UserRepository } from 'src/domain/repositories/user.repository';
import { CreateUserUseCase } from './create-user.usecase';

function makeCompany(): CompanyEntity {
  return new CompanyEntity({
    corporateName: 'Auto Pecas LTDA',
    tradeName: 'Auto Pecas',
    cnpj: '12345678000199',
    contactEmail: 'contato@autopecas.com',
    phone: '11999999999',
  });
}

function makeInput(companyId: string) {
  return {
    name: 'Jane Doe',
    email: 'jane@autopecas.com',
    password: 'plainPassword123',
    role: RoleEnum.USER,
    companyId,
  };
}

describe('CreateUserUseCase', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let companyRepository: jest.Mocked<CompanyRepository>;
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn((user: UserEntity) => Promise.resolve(user)),
    } as unknown as jest.Mocked<UserRepository>;
    companyRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<CompanyRepository>;
    useCase = new CreateUserUseCase(userRepository, companyRepository);
  });

  it('throws NotFoundException when the company does not exist', async () => {
    companyRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(makeInput('missing-company'))).rejects.toThrow(
      NotFoundException,
    );
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it('rejects when the email is already taken', async () => {
    const company = makeCompany();
    companyRepository.findById.mockResolvedValue(company);
    userRepository.findByEmail.mockResolvedValue(
      new UserEntity({ ...makeInput(company.id) }),
    );

    await expect(useCase.execute(makeInput(company.id))).rejects.toThrow(
      BadRequestException,
    );
  });

  it('hashes the password before persisting the user', async () => {
    const company = makeCompany();
    companyRepository.findById.mockResolvedValue(company);
    const input = makeInput(company.id);

    const result = await useCase.execute(input);

    expect(result.password).not.toBe(input.password);
    expect(result.password.length).toBeGreaterThan(0);
  });
});
