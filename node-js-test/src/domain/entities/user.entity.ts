import { BaseEntity, IBaseEntity } from 'src/shared/bases/base.entity';
import { RoleEnum } from '../enums/role.enum';

export interface IUserEntity extends IBaseEntity {
  name: string;
  email: string;
  role: RoleEnum;
  password: string;
  companyId: string;
}

export class UserEntity extends BaseEntity {
  private _name: string;
  private _email: string;
  private _role: RoleEnum;
  private _password: string;
  private _companyId: string;

  constructor(data: IUserEntity) {
    super(data);
    this._name = data.name;
    this._email = data.email;
    this._password = data.password;
    this._companyId = data.companyId;
    this._role = data.role;
  }

  get name(): string {
    return this._name;
  }

  get email(): string {
    return this._email;
  }

  get password(): string {
    return this._password;
  }

  get companyId(): string {
    return this._companyId;
  }

  get role(): RoleEnum {
    return this._role;
  }

  set name(value: string) {
    this._name = value;
  }

  set email(value: string) {
    this._email = value;
  }

  set password(value: string) {
    this._password = value;
  }

  set companyId(value: string) {
    this._companyId = value;
  }
  set role(value: RoleEnum) {
    this._role = value;
  }
}
