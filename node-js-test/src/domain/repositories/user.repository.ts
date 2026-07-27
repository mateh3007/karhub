import { BaseRepository } from 'src/shared/bases/base.repository';
import {
  IPaginatedResult,
  IPaginationParams,
} from 'src/shared/interfaces/pagination.interface';
import { UserEntity } from '../entities/user.entity';

export abstract class UserRepository extends BaseRepository<UserEntity> {
  abstract findByEmail(email: string): Promise<UserEntity | null>;
  abstract findPageByCompanyId(
    companyId: string,
    pagination: IPaginationParams,
  ): Promise<IPaginatedResult<UserEntity>>;
  abstract findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<UserEntity | null>;
}
