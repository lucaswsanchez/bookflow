import { Role } from '@prisma/client';

/** Claims stored in the access token and attached to request.user. */
export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  role: Role;
  businessId: string;
  staffId: string | null;
}
