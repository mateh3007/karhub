import { BaseRepository } from 'src/shared/bases/base.repository';
import { CompanyEntity } from '../entities/company.entity';

export abstract class CompanyRepository extends BaseRepository<CompanyEntity> {
  abstract findByCnpj(cnpj: string): Promise<CompanyEntity | null>;
  abstract findByEmail(email: string): Promise<CompanyEntity | null>;
}
