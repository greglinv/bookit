import "dotenv/config";
import cors from "cors";
import express from "express";
import { prisma } from "./lib/prisma";

const app = express();
const port = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());

app.get("/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
