import { Request } from 'express';
import { IJwtPayload } from 'src/domain/interfaces/auth/jwt-payload.interface';

export interface AuthenticatedRequest extends Request {
  user: IJwtPayload;
}
