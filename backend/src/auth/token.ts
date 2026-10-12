import type { Role } from "@prisma/client";
import jwt from "jsonwebtoken";
import { config } from "../config";

export const COOKIE_NAME = "token";
export const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface AuthUser {
  id: string;
  role: Role;
}

export function signToken(user: AuthUser): string {
  return jwt.sign({ role: user.role }, config.jwtSecret, {
    algorithm: "HS256",
    subject: user.id,
    expiresIn: TOKEN_TTL_SECONDS,
  });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] });
    if (typeof payload === "string" || !payload.sub) return null;
    return { id: payload.sub, role: payload.role as Role };
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  // Frontend (Vercel) and API (Railway/Fly) are different sites in production.
  sameSite: config.isProduction ? ("none" as const) : ("lax" as const),
  path: "/",
};
