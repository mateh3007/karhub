import { PartPriorityService } from 'src/application/services/part-priority.service';
import { CacheAdapter } from 'src/domain/adapters/cache.adapter';
import { PartEntity, IPartEntity } from 'src/domain/entities/part.entity';
import { PartRepository } from 'src/domain/repositories/part.repository';
import { GetRestockPrioritiesUseCase } from './get-restock-priorities.usecase';

function makePart(overrides: Partial<IPartEntity> = {}): PartEntity {
  return new PartEntity({
    name: 'Part',
    category: 'misc',
    currentStock: 10,
    minimumStock: 10,
    averageDailySales: 2,
    leadTimeDays: 5,
    unitCost: 5,
    criticalityLevel: 2,
    companyId: 'company-1',
    ...overrides,
  });
}

describe('GetRestockPrioritiesUseCase', () => {
  let partRepository: jest.Mocked<PartRepository>;
  let cacheAdapter: jest.Mocked<CacheAdapter>;
  let useCase: GetRestockPrioritiesUseCase;

  beforeEach(() => {
    partRepository = {
      findByCompanyId: jest.fn(),
    } as unknown as jest.Mocked<PartRepository>;
    cacheAdapter = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(),
      del: jest.fn(),
    };
    useCase = new GetRestockPrioritiesUseCase(
      partRepository,
      new PartPriorityService(),
      cacheAdapter,
    );
  });

  it('fetches all parts for the company, without a category filter', async () => {
    partRepository.findByCompanyId.mockResolvedValue([]);

    await useCase.execute({ companyId: 'company-1' });

    expect(partRepository.findByCompanyId).toHaveBeenCalledWith('company-1');
  });

  it('excludes parts that do not need restocking and sorts the rest by urgency', async () => {
    const urgent = makePart({
      name: 'Urgent',
      currentStock: -5,
      criticalityLevel: 5,
    });
    const mild = makePart({
      name: 'Mild',
      currentStock: 5,
      criticalityLevel: 1,
    });
    const wellStocked = makePart({
      name: 'Well Stocked',
      currentStock: 1000,
      minimumStock: 5,
      averageDailySales: 1,
      leadTimeDays: 1,
    });
    partRepository.findByCompanyId.mockResolvedValue([
      mild,
      wellStocked,
      urgent,
    ]);

    const result = await useCase.execute({ companyId: 'company-1' });

    expect(result.map((part) => part.name)).toEqual(['Urgent', 'Mild']);
  });

  it('reads from the cache using the company-scoped key and skips the repository on a hit', async () => {
    const cachedPart = makePart({ name: 'Cached' });
    cacheAdapter.get.mockResolvedValue([cachedPart.toJSON()]);

    const result = await useCase.execute({ companyId: 'company-1' });

    expect(cacheAdapter.get).toHaveBeenCalledWith(
      PartPriorityService.cacheKeyFor('company-1'),
    );
    expect(partRepository.findByCompanyId).not.toHaveBeenCalled();
    expect(cacheAdapter.set).not.toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(PartEntity);
    expect(result[0].name).toBe('Cached');
    expect(result[0].urgencyScore()).toBe(cachedPart.urgencyScore());
  });

  it('stores the computed result in the cache under the company-scoped key on a miss', async () => {
    const urgent = makePart({
      name: 'Urgent',
      currentStock: -5,
      criticalityLevel: 5,
    });
    partRepository.findByCompanyId.mockResolvedValue([urgent]);

    const result = await useCase.execute({ companyId: 'company-1' });

    expect(cacheAdapter.set).toHaveBeenCalledWith(
      PartPriorityService.cacheKeyFor('company-1'),
      result,
      expect.any(Number),
    );
  });
});
