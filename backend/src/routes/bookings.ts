import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/middleware";
import { cancelBooking, createBooking, listCustomerBookings } from "../services/booking";

const createSchema = z.object({
  serviceId: z.string().min(1),
  startTime: z.iso.datetime({ offset: true }).transform((s) => new Date(s)),
});

export const bookingsRouter = Router();
bookingsRouter.use(requireAuth);

bookingsRouter.post("/", async (req, res) => {
  const body = createSchema.parse(req.body);
  const booking = await createBooking({
    customerId: req.user!.id,
    serviceId: body.serviceId,
    startTime: body.startTime,
  });
  res.status(201).json({ booking });
});

bookingsRouter.get("/", async (req, res) => {
  res.json({ bookings: await listCustomerBookings(req.user!.id) });
});

bookingsRouter.post("/:id/cancel", async (req, res) => {
  res.json({ booking: await cancelBooking(req.params.id, req.user!) });
});
