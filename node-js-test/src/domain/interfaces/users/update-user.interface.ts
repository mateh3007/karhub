import { RoleEnum } from '../../enums/role.enum';

export interface IUpdateUser {
  id: string;
  companyId: string;
  name?: string;
  email?: string;
  password?: string;
  role?: RoleEnum;
}
