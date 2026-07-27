import { NotFoundException } from '@nestjs/common';
import { CompanyEntity } from 'src/domain/entities/company.entity';
import { CompanyRepository } from 'src/domain/repositories/company.repository';
import { DeleteCompanyUseCase } from './delete-company.usecase';

describe('DeleteCompanyUseCase', () => {
  let companyRepository: jest.Mocked<CompanyRepository>;
  let useCase: DeleteCompanyUseCase;

  beforeEach(() => {
    companyRepository = {
      findById: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<CompanyRepository>;
    useCase = new DeleteCompanyUseCase(companyRepository);
  });

  it('throws NotFoundException when the company does not exist', async () => {
    companyRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 'missing-id', companyId: 'missing-id' }),
    ).rejects.toThrow(NotFoundException);
    expect(companyRepository.delete).not.toHaveBeenCalled();
  });

  it("throws NotFoundException when the company isn't the caller's own", async () => {
    const company = new CompanyEntity({
      corporateName: 'Auto Pecas LTDA',
      tradeName: 'Auto Pecas',
      cnpj: '12345678000199',
      contactEmail: 'contato@autopecas.com',
      phone: '11999999999',
    });
    companyRepository.findById.mockResolvedValue(company);

    await expect(
      useCase.execute({ id: company.id, companyId: 'another-company' }),
    ).rejects.toThrow(NotFoundException);
    expect(companyRepository.delete).not.toHaveBeenCalled();
  });

  it('deletes the company when it exists and belongs to the caller', async () => {
    const company = new CompanyEntity({
      corporateName: 'Auto Pecas LTDA',
      tradeName: 'Auto Pecas',
      cnpj: '12345678000199',
      contactEmail: 'contato@autopecas.com',
      phone: '11999999999',
    });
    companyRepository.findById.mockResolvedValue(company);

    await useCase.execute({ id: company.id, companyId: company.id });

    expect(companyRepository.delete).toHaveBeenCalledWith(company.id);
  });
});
