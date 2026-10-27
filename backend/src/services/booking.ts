import { BookingStatus, type Prisma } from "@prisma/client";
import { DateTime } from "luxon";
import { config } from "../config";
import { HttpError } from "../lib/errors";
import { prisma } from "../lib/prisma";

export const SLOT_MINUTES = 15;
const ACTIVE_STATUSES: BookingStatus[] = [BookingStatus.PENDING, BookingStatus.CONFIRMED];

const bookingInclude = {
  service: { select: { id: true, name: true, durationMinutes: true, priceCents: true } },
  business: { select: { id: true, name: true, timezone: true } },
} satisfies Prisma.BookingInclude;

function minuteOfDay(dt: DateTime) {
  return dt.hour * 60 + dt.minute;
}

// Luxon weekday is 1 (Mon) - 7 (Sun); our schema uses 0 (Sun) - 6 (Sat).
function dayOfWeek(dt: DateTime) {
  return dt.weekday % 7;
}

export async function getAvailableSlots(serviceId: string, date: string) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { business: { include: { availability: true } } },
  });
  if (!service) throw new HttpError(404, "Service not found");

  const { business } = service;
  const day = DateTime.fromISO(date, { zone: business.timezone });
  if (!day.isValid || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new HttpError(400, "date must be YYYY-MM-DD");
  }
  const dayStart = day.startOf("day");
  const dayEnd = dayStart.plus({ days: 1 });

  const windows = business.availability.filter((w) => w.dayOfWeek === dayOfWeek(dayStart));
  const booked = await prisma.booking.findMany({
    where: {
      businessId: business.id,
      status: { in: ACTIVE_STATUSES },
      startTime: { lt: dayEnd.toJSDate() },
      endTime: { gt: dayStart.toJSDate() },
    },
    select: { startTime: true, endTime: true },
  });

  const now = DateTime.now();
  const slots: { startTime: string; endTime: string }[] = [];
  for (const w of windows) {
    for (let m = w.startMinute; m + service.durationMinutes <= w.endMinute; m += SLOT_MINUTES) {
      const start = dayStart.plus({ minutes: m });
      const end = start.plus({ minutes: service.durationMinutes });
      if (start <= now) continue;
      const conflicts = booked.some(
        (b) => b.startTime < end.toJSDate() && b.endTime > start.toJSDate(),
      );
      if (!conflicts) {
        slots.push({ startTime: start.toUTC().toISO()!, endTime: end.toUTC().toISO()! });
      }
    }
  }
  return slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export async function createBooking(input: { customerId: string; serviceId: string; startTime: Date }) {
  const service = await prisma.service.findUnique({
    where: { id: input.serviceId },
    include: { business: { include: { availability: true } } },
  });
  if (!service) throw new HttpError(404, "Service not found");
  const { business } = service;

  const start = DateTime.fromJSDate(input.startTime, { zone: business.timezone });
  const startMinute = minuteOfDay(start);
  const endMinute = startMinute + service.durationMinutes;

  if (input.startTime <= new Date()) throw new HttpError(422, "Start time must be in the future");
  if (start.second !== 0 || start.millisecond !== 0 || startMinute % SLOT_MINUTES !== 0) {
    throw new HttpError(422, `Start time must be on a ${SLOT_MINUTES}-minute boundary`);
  }
  const withinHours = business.availability.some(
    (w) => w.dayOfWeek === dayOfWeek(start) && startMinute >= w.startMinute && endMinute <= w.endMinute,
  );
  if (!withinHours) throw new HttpError(422, "Requested time is outside business hours");

  const endTime = start.plus({ minutes: service.durationMinutes }).toJSDate();

  // One business = one resource. The row lock serializes concurrent bookings for the same
  // business so the overlap check and the insert are atomic with respect to each other.
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Business" WHERE id = ${business.id} FOR UPDATE`;

    const conflict = await tx.booking.findFirst({
      where: {
        businessId: business.id,
        status: { in: ACTIVE_STATUSES },
        startTime: { lt: endTime },
        endTime: { gt: input.startTime },
      },
      select: { id: true },
    });
    if (conflict) throw new HttpError(409, "That time slot is no longer available");

    return tx.booking.create({
      data: {
        customerId: input.customerId,
        serviceId: service.id,
        businessId: business.id,
        startTime: input.startTime,
        endTime,
        status: BookingStatus.CONFIRMED,
      },
      include: bookingInclude,
    });
  });
}

export function listCustomerBookings(customerId: string) {
  return prisma.booking.findMany({
    where: { customerId },
    include: bookingInclude,
    orderBy: { startTime: "asc" },
  });
}

export async function listBusinessBookings(
  businessId: string,
  ownerId: string,
  range: { from?: Date; to?: Date },
) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business || business.ownerId !== ownerId) throw new HttpError(404, "Business not found");

  return prisma.booking.findMany({
    where: {
      businessId,
      ...(range.from && { endTime: { gt: range.from } }),
      ...(range.to && { startTime: { lt: range.to } }),
    },
    include: { ...bookingInclude, customer: { select: { id: true, email: true } } },
    orderBy: { startTime: "asc" },
  });
}

export async function cancelBooking(bookingId: string, user: { id: string }) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { business: { select: { ownerId: true } } },
  });
  const isCustomer = booking?.customerId === user.id;
  const isBusinessOwner = booking?.business.ownerId === user.id;
  // 404 rather than 403 so booking ids can't be probed by other users.
  if (!booking || (!isCustomer && !isBusinessOwner)) throw new HttpError(404, "Booking not found");

  if (!ACTIVE_STATUSES.includes(booking.status)) {
    throw new HttpError(409, `Booking is already ${booking.status.toLowerCase()}`);
  }
  if (booking.startTime <= new Date()) throw new HttpError(409, "Booking has already started");

  if (!isBusinessOwner) {
    const hoursUntil = (booking.startTime.getTime() - Date.now()) / 3_600_000;
    if (hoursUntil < config.cancellationWindowHours) {
      throw new HttpError(
        422,
        `Bookings can only be cancelled at least ${config.cancellationWindowHours} hours in advance`,
      );
    }
  }

  return prisma.booking.update({
    where: { id: bookingId },
    data: { status: BookingStatus.CANCELLED },
    include: bookingInclude,
  });
}
