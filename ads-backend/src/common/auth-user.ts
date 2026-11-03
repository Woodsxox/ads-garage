import type { Request } from 'express';

export type Role = 'user' | 'admin';

/** What the access token proves. Kept small: anything else is loaded from the database. */
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export type AuthedRequest = Request & { user: AuthUser };
