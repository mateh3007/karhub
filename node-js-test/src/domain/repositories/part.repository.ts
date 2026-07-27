import { BaseRepository } from 'src/shared/bases/base.repository';
import {
  IPaginatedResult,
  IPaginationParams,
} from 'src/shared/interfaces/pagination.interface';
import { PartEntity } from '../entities/part.entity';

export abstract class PartRepository extends BaseRepository<PartEntity> {
  abstract findByCompanyId(
    companyId: string,
    category?: string,
  ): Promise<PartEntity[]>;
  abstract findPageByCompanyId(
    companyId: string,
    pagination: IPaginationParams,
    category?: string,
  ): Promise<IPaginatedResult<PartEntity>>;
  abstract findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<PartEntity | null>;
}
