export type Role = "CUSTOMER" | "OWNER";

export interface User {
  id: string;
  email: string;
  role: Role;
}

export interface BusinessSummary {
  id: string;
  name: string;
  description: string | null;
  timezone: string;
}

export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
}

export interface AvailabilityWindow {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
}

export interface BusinessDetail extends BusinessSummary {
  services: Service[];
  availability: AvailabilityWindow[];
}

export interface Slot {
  startTime: string;
  endTime: string;
}

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  service: Service;
  business: { id: string; name: string; timezone: string };
}
