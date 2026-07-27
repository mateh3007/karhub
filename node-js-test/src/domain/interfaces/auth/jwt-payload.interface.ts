import { RoleEnum } from '../../enums/role.enum';

export interface IJwtPayload {
  sub: string;
  email: string;
  role: RoleEnum;
  companyId: string;
}
