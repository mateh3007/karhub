import { NotFoundException } from '@nestjs/common';
import { PartEntity } from 'src/domain/entities/part.entity';
import { PartRepository } from 'src/domain/repositories/part.repository';
import { GetPartByIdUseCase } from './get-part-by-id.usecase';

describe('GetPartByIdUseCase', () => {
  let partRepository: jest.Mocked<PartRepository>;
  let useCase: GetPartByIdUseCase;

  beforeEach(() => {
    partRepository = {
      findByIdAndCompanyId: jest.fn(),
    } as unknown as jest.Mocked<PartRepository>;
    useCase = new GetPartByIdUseCase(partRepository);
  });

  it('returns the part when it belongs to the given company', async () => {
    const part = new PartEntity({
      name: 'Part A',
      category: 'engine',
      currentStock: 1,
      minimumStock: 1,
      averageDailySales: 1,
      leadTimeDays: 1,
      unitCost: 1,
      criticalityLevel: 1,
      companyId: 'company-1',
    });
    partRepository.findByIdAndCompanyId.mockResolvedValue(part);

    const result = await useCase.execute({
      id: part.id,
      companyId: 'company-1',
    });

    expect(partRepository.findByIdAndCompanyId).toHaveBeenCalledWith(
      part.id,
      'company-1',
    );
    expect(result).toBe(part);
  });

  it('throws NotFoundException when the part does not exist for that company', async () => {
    partRepository.findByIdAndCompanyId.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 'missing-id', companyId: 'company-1' }),
    ).rejects.toThrow(NotFoundException);
  });
});
