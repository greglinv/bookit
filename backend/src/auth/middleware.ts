import type { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { COOKIE_NAME, verifyToken, type AuthUser } from "./token";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  const user = token ? verifyToken(token) : null;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  req.user = user;
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
