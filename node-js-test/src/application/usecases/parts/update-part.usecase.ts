import { Injectable, NotFoundException } from '@nestjs/common';
import { PartPriorityService } from 'src/application/services/part-priority.service';
import { CacheAdapter } from 'src/domain/adapters/cache.adapter';
import { PartEntity } from 'src/domain/entities/part.entity';
import { IUpdatePart } from 'src/domain/interfaces/parts/update-part.interface';
import { PartRepository } from 'src/domain/repositories/part.repository';
import { BaseUsecase } from 'src/shared/bases/base.usecase';

@Injectable()
export class UpdatePartUseCase extends BaseUsecase<IUpdatePart, PartEntity> {
  constructor(
    private readonly partRepository: PartRepository,
    private readonly cacheAdapter: CacheAdapter,
  ) {
    super();
  }

  async execute(data: IUpdatePart): Promise<PartEntity> {
    const part = await this.partRepository.findByIdAndCompanyId(
      data.id,
      data.companyId,
    );
    if (!part) {
      throw new NotFoundException('Part not found');
    }

    if (data.name) {
      part.name = data.name;
    }

    if (data.category) {
      part.category = data.category;
    }

    if (data.currentStock !== undefined) {
      part.currentStock = data.currentStock;
    }

    if (data.minimumStock !== undefined) {
      part.minimumStock = data.minimumStock;
    }

    if (data.averageDailySales !== undefined) {
      part.averageDailySales = data.averageDailySales;
    }

    if (data.leadTimeDays !== undefined) {
      part.leadTimeDays = data.leadTimeDays;
    }

    if (data.unitCost !== undefined) {
      part.unitCost = data.unitCost;
    }

    if (data.criticalityLevel !== undefined) {
      part.criticalityLevel = data.criticalityLevel;
    }

    const updated = await this.partRepository.update(part);
    await this.cacheAdapter.del(
      PartPriorityService.cacheKeyFor(data.companyId),
    );
    return updated;
  }
}
