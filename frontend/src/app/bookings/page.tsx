"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { api, errorMessage } from "@/lib/api";
import { formatDateTime, formatDuration, formatPrice } from "@/lib/format";
import type { Booking } from "@/lib/types";
import { useApi } from "@/lib/useApi";

function BookingCard({
  booking,
  onCancel,
  cancelling,
}: {
  booking: Booking;
  onCancel?: () => void;
  cancelling?: boolean;
}) {
  const { service, business } = booking;
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div>
        <p className="font-medium">
          {service.name} <span className="font-normal text-black/60 dark:text-white/60">at</span>{" "}
          <Link href={`/businesses/${business.id}`} className="hover:underline">
            {business.name}
          </Link>
        </p>
        <p className="text-sm text-black/60 dark:text-white/60">
          {formatDateTime(booking.startTime, business.timezone)} &middot;{" "}
          {formatDuration(service.durationMinutes)} &middot; {formatPrice(service.priceCents)}
        </p>
        {booking.status === "CANCELLED" && (
          <span className="mt-1 inline-block rounded bg-black/10 px-2 py-0.5 text-xs dark:bg-white/15">
            Cancelled
          </span>
        )}
      </div>
      {onCancel && (
        <button
          onClick={onCancel}
          disabled={cancelling}
          className="rounded-md border border-black/20 px-3 py-1.5 text-sm hover:bg-black/5 disabled:opacity-50 dark:border-white/25 dark:hover:bg-white/10"
        >
          {cancelling ? "Cancelling…" : "Cancel"}
        </button>
      )}
    </li>
  );
}

function BookingsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const justBooked = useSearchParams().get("booked") === "1";
  const [now] = useState(() => Date.now());
  const [version, setVersion] = useState(0);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (user === null) router.replace("/login?next=/bookings");
  }, [user, router]);

  const res = useApi<{ bookings: Booking[] }>(user ? "/bookings" : null, version);
  const bookings = res.lastData?.bookings;

  async function cancel(b: Booking) {
    if (!window.confirm(`Cancel ${b.service.name} on ${formatDateTime(b.startTime, b.business.timezone)}?`)) return;
    setCancellingId(b.id);
    setActionError(null);
    try {
      await api(`/bookings/${b.id}/cancel`, { method: "POST" });
      setVersion((v) => v + 1);
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setCancellingId(null);
    }
  }

  if (!user) return <p className="text-black/60 dark:text-white/60">Loading…</p>;

  const upcoming = (bookings ?? []).filter((b) => b.status !== "CANCELLED" && new Date(b.endTime).getTime() > now);
  const past = (bookings ?? [])
    .filter((b) => !upcoming.includes(b))
    .sort((a, b) => b.startTime.localeCompare(a.startTime));

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">My bookings</h1>

      {justBooked && !actionError && (
        <p role="status" className="mt-4 rounded-md border border-green-600/40 bg-green-600/10 p-3 text-sm">
          You&apos;re booked! Your appointment is confirmed.
        </p>
      )}
      {actionError && (
        <p role="alert" className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm">
          {actionError}
        </p>
      )}
      {res.error && (
        <p role="alert" className="mt-4 text-sm">
          Couldn&apos;t load your bookings: {res.error.message}
        </p>
      )}

      {!bookings && !res.error ? (
        <p className="mt-6 text-black/60 dark:text-white/60">Loading…</p>
      ) : bookings && bookings.length === 0 ? (
        <p className="mt-6 text-black/60 dark:text-white/60">
          You have no bookings yet.{" "}
          <Link href="/" className="underline">
            Find a business
          </Link>
        </p>
      ) : bookings ? (
        <>
          <section className="mt-6">
            <h2 className="text-lg font-medium">Upcoming</h2>
            {upcoming.length === 0 ? (
              <p className="mt-2 text-sm text-black/60 dark:text-white/60">Nothing upcoming.</p>
            ) : (
              <ul className="mt-2 divide-y divide-black/10 rounded-lg border border-black/10 dark:divide-white/15 dark:border-white/15">
                {upcoming.map((b) => (
                  <BookingCard key={b.id} booking={b} onCancel={() => cancel(b)} cancelling={cancellingId === b.id} />
                ))}
              </ul>
            )}
          </section>
          {past.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-medium">Past &amp; cancelled</h2>
              <ul className="mt-2 divide-y divide-black/10 rounded-lg border border-black/10 opacity-80 dark:divide-white/15 dark:border-white/15">
                {past.map((b) => (
                  <BookingCard key={b.id} booking={b} />
                ))}
              </ul>
            </section>
          )}
        </>
      ) : null}
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense>
      <BookingsContent />
    </Suspense>
  );
}
