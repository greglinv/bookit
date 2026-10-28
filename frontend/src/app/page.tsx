import Link from "next/link";
import { api, errorMessage } from "@/lib/api";
import type { BusinessSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  let businesses: BusinessSummary[] = [];
  let error: string | null = null;
  try {
    businesses = (await api<{ businesses: BusinessSummary[] }>("/businesses")).businesses;
  } catch (err) {
    error = errorMessage(err);
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Book your next appointment</h1>
      <p className="mt-2 text-black/60 dark:text-white/60">
        Pick a business, choose a service, and grab a time that works for you.
      </p>

      {error ? (
        <p role="alert" className="mt-8 rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm">
          Couldn&apos;t load businesses right now ({error}). Please try again shortly.
        </p>
      ) : businesses.length === 0 ? (
        <p className="mt-8 text-black/60 dark:text-white/60">No businesses are taking bookings yet.</p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {businesses.map((b) => (
            <li key={b.id}>
              <Link
                href={`/businesses/${b.id}`}
                className="block rounded-lg border border-black/10 p-5 transition hover:border-black/30 hover:shadow-sm dark:border-white/15 dark:hover:border-white/40"
              >
                <h2 className="text-lg font-medium">{b.name}</h2>
                {b.description && (
                  <p className="mt-1 text-sm text-black/60 dark:text-white/60">{b.description}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
