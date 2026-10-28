import Link from "next/link";
import { notFound } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { formatDuration, formatMinuteOfDay, formatPrice, timezoneLabel } from "@/lib/format";
import type { BusinessDetail } from "@/lib/types";

export const dynamic = "force-dynamic";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default async function BusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let business: BusinessDetail;
  try {
    business = (await api<{ business: BusinessDetail }>(`/businesses/${id}`)).business;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div>
      <Link href="/" className="text-sm text-black/60 hover:underline dark:text-white/60">
        &larr; All businesses
      </Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{business.name}</h1>
      {business.description && (
        <p className="mt-2 text-black/60 dark:text-white/60">{business.description}</p>
      )}

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_16rem]">
        <section>
          <h2 className="text-lg font-medium">Services</h2>
          {business.services.length === 0 ? (
            <p className="mt-3 text-black/60 dark:text-white/60">No services listed yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-black/10 rounded-lg border border-black/10 dark:divide-white/15 dark:border-white/15">
              {business.services.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-sm text-black/60 dark:text-white/60">
                      {formatDuration(s.durationMinutes)} &middot; {formatPrice(s.priceCents)}
                    </p>
                  </div>
                  <Link
                    href={`/businesses/${business.id}/book/${s.id}`}
                    className="rounded-md bg-foreground px-4 py-2 text-sm text-background hover:opacity-90"
                  >
                    Book
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-lg font-medium">Hours</h2>
          <dl className="mt-3 space-y-1 text-sm">
            {WEEK_ORDER.map((day) => {
              const windows = business.availability.filter((w) => w.dayOfWeek === day);
              return (
                <div key={day} className="flex justify-between gap-3">
                  <dt className="text-black/60 dark:text-white/60">{DAY_NAMES[day]}</dt>
                  <dd className="text-right">
                    {windows.length
                      ? windows
                          .map((w) => `${formatMinuteOfDay(w.startMinute)} – ${formatMinuteOfDay(w.endMinute)}`)
                          .join(", ")
                      : "Closed"}
                  </dd>
                </div>
              );
            })}
          </dl>
          <p className="mt-3 text-xs text-black/50 dark:text-white/50">
            All times are {timezoneLabel(business.timezone)}.
          </p>
        </section>
      </div>
    </div>
  );
}
