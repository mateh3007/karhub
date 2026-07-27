import { RoleEnum } from '../../enums/role.enum';

export interface ICreateUser {
  name: string;
  email: string;
  password: string;
  role: RoleEnum;
  companyId: string;
}
