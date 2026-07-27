import { Module } from '@nestjs/common';
import { PartPriorityService } from './application/services/part-priority.service';
import { CreatePartUseCase } from './application/usecases/parts/create-part.usecase';
import { DeletePartUseCase } from './application/usecases/parts/delete-part.usecase';
import { GetAllPartsUseCase } from './application/usecases/parts/get-all-parts.usecase';
import { GetPartByIdUseCase } from './application/usecases/parts/get-part-by-id.usecase';
import { GetRestockPrioritiesUseCase } from './application/usecases/parts/get-restock-priorities.usecase';
import { UpdatePartUseCase } from './application/usecases/parts/update-part.usecase';
import { CacheAdapter } from './domain/adapters/cache.adapter';
import { DatabaseModule } from './infra/database/database.module';
import { RedisCacheAdapter } from './infra/adapters/redis-cache.adapter';
import { PartsController } from './presentation/controllers/parts.controller';
import { RestockController } from './presentation/controllers/restock.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [PartsController, RestockController],
  providers: [
    { provide: CacheAdapter, useClass: RedisCacheAdapter },
    CreatePartUseCase,
    GetAllPartsUseCase,
    GetPartByIdUseCase,
    UpdatePartUseCase,
    DeletePartUseCase,
    GetRestockPrioritiesUseCase,
    PartPriorityService,
  ],
})
export class PartModule {}
