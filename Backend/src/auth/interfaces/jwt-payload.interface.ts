/* eslint-disable prettier/prettier */
export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  pwdv?: string;
  iat?: number;
  exp?: number;
}
