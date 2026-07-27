import { BaseEntity, IBaseEntity } from 'src/shared/bases/base.entity';

export interface ICompanyEntity extends IBaseEntity {
  cnpj: string;
  corporateName: string;
  tradeName: string;
  contactEmail: string;
  phone: string;
}

export class CompanyEntity extends BaseEntity {
  private _cnpj: string;
  private _corporateName: string;
  private _tradeName: string;
  private _contactEmail: string;
  private _phone: string;

  constructor(data: ICompanyEntity) {
    super(data);
    this._cnpj = data.cnpj;
    this._corporateName = data.corporateName;
    this._tradeName = data.tradeName;
    this._contactEmail = data.contactEmail;
    this._phone = data.phone;
  }

  get cnpj(): string {
    return this._cnpj;
  }

  get corporateName(): string {
    return this._corporateName;
  }

  get tradeName(): string {
    return this._tradeName;
  }

  get contactEmail(): string {
    return this._contactEmail;
  }

  get phone(): string {
    return this._phone;
  }

  set cnpj(value: string) {
    this._cnpj = value;
  }

  set corporateName(value: string) {
    this._corporateName = value;
  }

  set tradeName(value: string) {
    this._tradeName = value;
  }

  set contactEmail(value: string) {
    this._contactEmail = value;
  }

  set phone(value: string) {
    this._phone = value;
  }
}
