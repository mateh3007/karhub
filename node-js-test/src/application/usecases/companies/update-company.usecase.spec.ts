import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CompanyEntity } from 'src/domain/entities/company.entity';
import { CompanyRepository } from 'src/domain/repositories/company.repository';
import { UpdateCompanyUseCase } from './update-company.usecase';

function makeExisting(): CompanyEntity {
  return new CompanyEntity({
    corporateName: 'Auto Pecas LTDA',
    tradeName: 'Auto Pecas',
    cnpj: '12345678000199',
    contactEmail: 'contato@autopecas.com',
    phone: '11999999999',
  });
}

describe('UpdateCompanyUseCase', () => {
  let companyRepository: jest.Mocked<CompanyRepository>;
  let useCase: UpdateCompanyUseCase;

  beforeEach(() => {
    companyRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn().mockResolvedValue(null),
      update: jest.fn((entity: CompanyEntity) => Promise.resolve(entity)),
    } as unknown as jest.Mocked<CompanyRepository>;
    useCase = new UpdateCompanyUseCase(companyRepository);
  });

  it('throws NotFoundException when the company does not exist', async () => {
    companyRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        id: 'missing-id',
        companyId: 'missing-id',
        tradeName: 'New Name',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it("throws NotFoundException when the company isn't the caller's own", async () => {
    const existing = makeExisting();
    companyRepository.findById.mockResolvedValue(existing);

    await expect(
      useCase.execute({
        id: existing.id,
        companyId: 'another-company',
        tradeName: 'New Name',
      }),
    ).rejects.toThrow(NotFoundException);
    expect(companyRepository.update).not.toHaveBeenCalled();
  });

  it('updates only the provided fields', async () => {
    const existing = makeExisting();
    companyRepository.findById.mockResolvedValue(existing);

    const result = await useCase.execute({
      id: existing.id,
      companyId: existing.id,
      tradeName: 'Auto Pecas Renovada',
    });

    expect(result.tradeName).toBe('Auto Pecas Renovada');
    expect(result.corporateName).toBe('Auto Pecas LTDA');
  });

  it('rejects when the new contact email already belongs to another company', async () => {
    const existing = makeExisting();
    companyRepository.findById.mockResolvedValue(existing);
    companyRepository.findByEmail.mockResolvedValue(
      new CompanyEntity({
        corporateName: 'Other Company',
        tradeName: 'Other',
        cnpj: '99999999000199',
        contactEmail: 'other@company.com',
        phone: '11888888888',
      }),
    );

    await expect(
      useCase.execute({
        id: existing.id,
        companyId: existing.id,
        contactEmail: 'other@company.com',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('allows keeping the same contact email without triggering the duplicate check', async () => {
    const existing = makeExisting();
    companyRepository.findById.mockResolvedValue(existing);

    await useCase.execute({
      id: existing.id,
      companyId: existing.id,
      contactEmail: existing.contactEmail,
    });

    expect(companyRepository.findByEmail).not.toHaveBeenCalled();
  });
});
