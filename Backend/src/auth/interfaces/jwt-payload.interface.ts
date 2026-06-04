/* eslint-disable prettier/prettier */
export interface JwtPayload {
  sub: number;      // user id — sub is standard JWT field name
  email: string;
  role: string;
  iat?: number;     // issued at — added automatically by JWT
  exp?: number;     // expiry — added automatically by JWT
}