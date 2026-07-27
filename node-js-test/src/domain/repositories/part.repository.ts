import { BaseRepository } from 'src/shared/bases/base.repository';
import { PartEntity } from '../entities/part.entity';

export abstract class PartRepository extends BaseRepository<PartEntity> {
  abstract findByCompanyId(
    companyId: string,
    category?: string,
  ): Promise<PartEntity[]>;
  abstract findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<PartEntity | null>;
}
