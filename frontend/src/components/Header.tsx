"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="border-b border-black/10 dark:border-white/15">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          BookIt
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {user === undefined ? null : user ? (
            <>
              <Link href="/bookings" className="hover:underline">
                My bookings
              </Link>
              <span className="hidden text-black/60 sm:inline dark:text-white/60">{user.email}</span>
              <button
                onClick={async () => {
                  await logout();
                  router.push("/");
                }}
                className="rounded-md border border-black/15 px-3 py-1 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-foreground px-3 py-1 text-background hover:opacity-90"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
