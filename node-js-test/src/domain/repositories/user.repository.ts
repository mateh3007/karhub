import { BaseRepository } from 'src/shared/bases/base.repository';
import { UserEntity } from '../entities/user.entity';

export abstract class UserRepository extends BaseRepository<UserEntity> {
  abstract findByEmail(email: string): Promise<UserEntity | null>;
  abstract findByCompanyId(companyId: string): Promise<UserEntity[]>;
  abstract findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<UserEntity | null>;
}
