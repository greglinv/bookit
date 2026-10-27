import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { config } from "./config";
import { HttpError } from "./lib/errors";
import { prisma } from "./lib/prisma";
import { authRouter } from "./routes/auth";
import { bookingsRouter } from "./routes/bookings";
import { businessesRouter } from "./routes/businesses";

export const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/businesses", businessesRouter);
app.use("/bookings", bookingsRouter);

// Express only treats a handler as an error handler if it declares all four params.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Invalid input", issues: err.issues });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};
app.use(errorHandler);
