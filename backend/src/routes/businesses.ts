import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../auth/middleware";
import { HttpError } from "../lib/errors";
import { prisma } from "../lib/prisma";
import { getAvailableSlots, listBusinessBookings } from "../services/booking";

export const businessesRouter = Router();

businessesRouter.get("/", async (_req, res) => {
  const businesses = await prisma.business.findMany({
    select: { id: true, name: true, description: true, timezone: true },
    orderBy: { name: "asc" },
  });
  res.json({ businesses });
});

businessesRouter.get("/:id", async (req, res) => {
  const business = await prisma.business.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      name: true,
      description: true,
      timezone: true,
      services: {
        select: { id: true, name: true, durationMinutes: true, priceCents: true },
        orderBy: { name: "asc" },
      },
      availability: {
        select: { dayOfWeek: true, startMinute: true, endMinute: true },
        orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
      },
    },
  });
  if (!business) throw new HttpError(404, "Business not found");
  res.json({ business });
});

businessesRouter.get("/:businessId/services/:serviceId/slots", async (req, res) => {
  const { date } = z.object({ date: z.string() }).parse(req.query);
  const service = await prisma.service.findFirst({
    where: { id: req.params.serviceId, businessId: req.params.businessId },
    select: { id: true },
  });
  if (!service) throw new HttpError(404, "Service not found");
  res.json({ slots: await getAvailableSlots(service.id, date) });
});

const rangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

businessesRouter.get("/:id/bookings", requireAuth, requireRole("OWNER"), async (req, res) => {
  const range = rangeSchema.parse(req.query);
  const bookings = await listBusinessBookings(req.params.id as string, req.user!.id, range);
  res.json({ bookings });
});
