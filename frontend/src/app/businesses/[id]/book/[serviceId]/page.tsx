"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { api, ApiError, errorMessage } from "@/lib/api";
import {
  formatDateTime,
  formatDuration,
  formatLongDate,
  formatPrice,
  formatTime,
  timezoneLabel,
  todayIn,
} from "@/lib/format";
import type { BusinessDetail, Slot } from "@/lib/types";
import { useApi } from "@/lib/useApi";

export default function BookPage() {
  const { id, serviceId } = useParams<{ id: string; serviceId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const businessRes = useApi<{ business: BusinessDetail }>(`/businesses/${id}`);
  const business = businessRes.data?.business;
  const service = business?.services.find((s) => s.id === serviceId);

  const [pickedDate, setPickedDate] = useState("");
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = business ? todayIn(business.timezone) : "";
  const date = pickedDate || today;

  const slotsRes = useApi<{ slots: Slot[] }>(
    business && service && date ? `/businesses/${id}/services/${serviceId}/slots?date=${date}` : null,
    refreshToken,
  );
  const slots = slotsRes.data?.slots;
  const selected = slots?.find((s) => s.startTime === selectedStart) ?? null;

  if (businessRes.error?.status === 404 || (business && !service)) {
    return <p>That service doesn&apos;t exist. <Link href="/" className="underline">Back to businesses</Link></p>;
  }
  if (businessRes.error) {
    return <p role="alert">Couldn&apos;t load this page: {businessRes.error.message}</p>;
  }
  if (!business || !service) return <p className="text-black/60 dark:text-white/60">Loading…</p>;

  const here = `/businesses/${id}/book/${serviceId}`;

  async function confirmBooking() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      await api("/bookings", { method: "POST", body: { serviceId, startTime: selected.startTime } });
      router.push("/bookings?booked=1");
    } catch (err) {
      setError(errorMessage(err));
      if (err instanceof ApiError && err.status === 409) {
        setSelectedStart(null);
        setRefreshToken((n) => n + 1);
      }
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Link href={`/businesses/${id}`} className="text-sm text-black/60 hover:underline dark:text-white/60">
        &larr; {business.name}
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Book {service.name}</h1>
      <p className="text-black/60 dark:text-white/60">
        {formatDuration(service.durationMinutes)} &middot; {formatPrice(service.priceCents)}
      </p>

      <div className="mt-6">
        <label className="block text-sm font-medium">
          Date
          <input
            type="date"
            min={today}
            value={date}
            onChange={(e) => {
              setPickedDate(e.target.value);
              setSelectedStart(null);
              setError(null);
            }}
            className="mt-1 block rounded-md border border-black/20 bg-transparent px-3 py-2 dark:border-white/25"
          />
        </label>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-medium">
          {date ? `Available times — ${formatLongDate(date)}` : "Available times"}
        </h2>
        <p className="text-xs text-black/50 dark:text-white/50">
          All times are {timezoneLabel(business.timezone)}.
        </p>
        {slotsRes.loading ? (
          <p className="mt-3 text-sm text-black/60 dark:text-white/60">Loading times…</p>
        ) : slotsRes.error ? (
          <p role="alert" className="mt-3 text-sm">
            {slotsRes.error.message}
          </p>
        ) : slots && slots.length === 0 ? (
          <p className="mt-3 text-sm text-black/60 dark:text-white/60">
            No openings on this day. Try another date.
          </p>
        ) : (
          <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {slots?.map((s) => (
              <li key={s.startTime}>
                <button
                  onClick={() => {
                    setSelectedStart(s.startTime);
                    setError(null);
                  }}
                  aria-pressed={s.startTime === selectedStart}
                  className={`w-full rounded-md border px-2 py-2 text-sm ${
                    s.startTime === selectedStart
                      ? "border-foreground bg-foreground text-background"
                      : "border-black/20 hover:border-black/50 dark:border-white/25 dark:hover:border-white/60"
                  }`}
                >
                  {formatTime(s.startTime, business.timezone)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <div className="mt-8 rounded-lg border border-black/15 p-5 dark:border-white/20">
          <h2 className="font-medium">Confirm your booking</h2>
          <p className="mt-1 text-sm">
            {service.name} at {business.name}
          </p>
          <p className="text-sm text-black/60 dark:text-white/60">
            {formatDateTime(selected.startTime, business.timezone)} &middot;{" "}
            {formatDuration(service.durationMinutes)} &middot; {formatPrice(service.priceCents)}
          </p>
          {user === null ? (
            <p className="mt-4 text-sm">
              <Link href={`/login?next=${encodeURIComponent(here)}`} className="underline">
                Log in
              </Link>{" "}
              or{" "}
              <Link href={`/signup?next=${encodeURIComponent(here)}`} className="underline">
                sign up
              </Link>{" "}
              to book this time.
            </p>
          ) : (
            <button
              onClick={confirmBooking}
              disabled={submitting || user === undefined}
              className="mt-4 rounded-md bg-foreground px-5 py-2 text-background hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Booking…" : "Confirm booking"}
            </button>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
