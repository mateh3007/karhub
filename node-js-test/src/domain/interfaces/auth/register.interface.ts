import { CompanyEntity } from '../../entities/company.entity';
import { UserEntity } from '../../entities/user.entity';

export interface IRegister {
  corporateName: string;
  tradeName: string;
  cnpj: string;
  phone: string;
  contactEmail: string;
  adminName: string;
  adminPassword: string;
}

export interface IRegisterResult {
  company: CompanyEntity;
  user: UserEntity;
}
