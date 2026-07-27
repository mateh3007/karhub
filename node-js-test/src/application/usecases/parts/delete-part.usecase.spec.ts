import { NotFoundException } from '@nestjs/common';
import { PartPriorityService } from 'src/application/services/part-priority.service';
import { CacheAdapter } from 'src/domain/adapters/cache.adapter';
import { PartEntity } from 'src/domain/entities/part.entity';
import { PartRepository } from 'src/domain/repositories/part.repository';
import { DeletePartUseCase } from './delete-part.usecase';

describe('DeletePartUseCase', () => {
  let partRepository: jest.Mocked<PartRepository>;
  let cacheAdapter: jest.Mocked<CacheAdapter>;
  let useCase: DeletePartUseCase;

  beforeEach(() => {
    partRepository = {
      findByIdAndCompanyId: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<PartRepository>;
    cacheAdapter = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };
    useCase = new DeletePartUseCase(partRepository, cacheAdapter);
  });

  it('throws NotFoundException when the part does not exist for that company', async () => {
    partRepository.findByIdAndCompanyId.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 'missing-id', companyId: 'company-1' }),
    ).rejects.toThrow(NotFoundException);
    expect(partRepository.delete).not.toHaveBeenCalled();
  });

  it('deletes the part when it belongs to the given company', async () => {
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

    await useCase.execute({ id: part.id, companyId: 'company-1' });

    expect(partRepository.delete).toHaveBeenCalledWith(part.id);
  });

  it("invalidates the restock priorities cache entry for the part's company", async () => {
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

    await useCase.execute({ id: part.id, companyId: 'company-1' });

    expect(cacheAdapter.del).toHaveBeenCalledWith(
      PartPriorityService.cacheKeyFor('company-1'),
    );
  });
});
