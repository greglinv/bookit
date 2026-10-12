import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Router, type Response } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/middleware";
import { COOKIE_NAME, TOKEN_TTL_SECONDS, cookieOptions, signToken } from "../auth/token";
import { prisma } from "../lib/prisma";

const BCRYPT_ROUNDS = 12;
// Compared against when the email is unknown so login timing doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_ROUNDS);

const email = z.string().trim().toLowerCase().email().max(254);

const signupSchema = z.object({
  email,
  // bcrypt only uses the first 72 bytes
  password: z.string().min(8).max(72),
  role: z.enum(["CUSTOMER", "OWNER"]).default("CUSTOMER"),
});

const loginSchema = z.object({
  email,
  password: z.string().min(1).max(72),
});

function publicUser(user: { id: string; email: string; role: string }) {
  return { id: user.id, email: user.email, role: user.role };
}

function setSessionCookie(res: Response, user: { id: string; role: "CUSTOMER" | "OWNER" }) {
  res.cookie(COOKIE_NAME, signToken(user), { ...cookieOptions, maxAge: TOKEN_TTL_SECONDS * 1000 });
}

export const authRouter = Router();

authRouter.post("/signup", async (req, res) => {
  const body = signupSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);

  try {
    const user = await prisma.user.create({
      data: { email: body.email, passwordHash, role: body.role },
    });
    setSessionCookie(res, user);
    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    throw err;
  }
});

authRouter.post("/login", async (req, res) => {
  const body = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  const valid = await bcrypt.compare(body.password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  setSessionCookie(res, user);
  res.json({ user: publicUser(user) });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  res.status(204).end();
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) {
    res.clearCookie(COOKIE_NAME, cookieOptions);
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ user: publicUser(user) });
});
