import { BadRequestException } from '@nestjs/common';
import { CompanyEntity } from 'src/domain/entities/company.entity';
import { CompanyRepository } from 'src/domain/repositories/company.repository';
import { CreateCompanyUseCase } from './create-company.usecase';

function makeInput() {
  return {
    corporateName: 'Auto Pecas LTDA',
    tradeName: 'Auto Pecas',
    cnpj: '12345678000199',
    contactEmail: 'contato@autopecas.com',
    phone: '11999999999',
  };
}

describe('CreateCompanyUseCase', () => {
  let companyRepository: jest.Mocked<CompanyRepository>;
  let useCase: CreateCompanyUseCase;

  beforeEach(() => {
    companyRepository = {
      findByCnpj: jest.fn().mockResolvedValue(null),
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    } as unknown as jest.Mocked<CompanyRepository>;
    useCase = new CreateCompanyUseCase(companyRepository);
  });

  it('creates the company when the cnpj and email are unused', async () => {
    const input = makeInput();
    const created = new CompanyEntity(input);
    companyRepository.create.mockResolvedValue(created);

    const result = await useCase.execute(input);

    expect(result).toBe(created);
  });

  it('rejects when the cnpj is already registered', async () => {
    companyRepository.findByCnpj.mockResolvedValue(
      new CompanyEntity(makeInput()),
    );

    await expect(useCase.execute(makeInput())).rejects.toThrow(
      BadRequestException,
    );
    expect(companyRepository.create).not.toHaveBeenCalled();
  });

  it('rejects when the contact email is already registered', async () => {
    companyRepository.findByEmail.mockResolvedValue(
      new CompanyEntity(makeInput()),
    );

    await expect(useCase.execute(makeInput())).rejects.toThrow(
      BadRequestException,
    );
    expect(companyRepository.create).not.toHaveBeenCalled();
  });
});
