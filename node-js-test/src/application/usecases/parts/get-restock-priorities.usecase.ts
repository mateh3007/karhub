import { Injectable } from '@nestjs/common';
import { PartPriorityService } from 'src/application/services/part-priority.service';
import { CacheAdapter } from 'src/domain/adapters/cache.adapter';
import { IPartEntity, PartEntity } from 'src/domain/entities/part.entity';
import { IGetRestockPriorities } from 'src/domain/interfaces/parts/get-restock-priorities.interface';
import { PartRepository } from 'src/domain/repositories/part.repository';
import { BaseUsecase } from 'src/shared/bases/base.usecase';
import { IPaginatedResult } from 'src/shared/interfaces/pagination.interface';

const DEFAULT_CACHE_TTL_SECONDS = 30;

@Injectable()
export class GetRestockPrioritiesUseCase extends BaseUsecase<
  IGetRestockPriorities,
  IPaginatedResult<PartEntity>
> {
  private readonly ttlSeconds = Number(
    process.env.RESTOCK_PRIORITIES_CACHE_TTL_SECONDS ??
      DEFAULT_CACHE_TTL_SECONDS,
  );

  constructor(
    private readonly partRepository: PartRepository,
    private readonly partPriorityService: PartPriorityService,
    private readonly cacheAdapter: CacheAdapter,
  ) {
    super();
  }

  async execute(
    data: IGetRestockPriorities,
  ): Promise<IPaginatedResult<PartEntity>> {
    const cacheKey = PartPriorityService.cacheKeyFor(data.companyId);

    const cached = await this.cacheAdapter.get<IPartEntity[]>(cacheKey);
    const prioritized = cached
      ? cached.map((part) => PartEntity.fromPlain(part))
      : await this.computeAndCache(data.companyId, cacheKey);

    return this.paginate(prioritized, data.page, data.limit);
  }

  private async computeAndCache(
    companyId: string,
    cacheKey: string,
  ): Promise<PartEntity[]> {
    const parts = await this.partRepository.findByCompanyId(companyId);
    const needingRestock = this.partPriorityService.filterNeedingRestock(parts);
    const prioritized = this.partPriorityService.sortByUrgency(needingRestock);

    await this.cacheAdapter.set(cacheKey, prioritized, this.ttlSeconds);
    return prioritized;
  }

  private paginate(
    parts: PartEntity[],
    page: number,
    limit: number,
  ): IPaginatedResult<PartEntity> {
    const start = (page - 1) * limit;
    return {
      data: parts.slice(start, start + limit),
      total: parts.length,
      page,
      limit,
      totalPages: Math.ceil(parts.length / limit),
    };
  }
}
