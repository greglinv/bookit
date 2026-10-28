"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { errorMessage } from "@/lib/api";
import { safeNext } from "@/lib/nav";
import { useAuth } from "./AuthProvider";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { login, signup } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isLogin = mode === "login";
  const otherHref = `${isLogin ? "/signup" : "/login"}${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await (isLogin ? login(email, password) : signup(email, password));
      router.push(next);
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">{isLogin ? "Log in" : "Create your account"}</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block text-sm">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-black/20 bg-transparent px-3 py-2 dark:border-white/25"
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            type="password"
            required
            minLength={isLogin ? 1 : 8}
            maxLength={72}
            autoComplete={isLogin ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-black/20 bg-transparent px-3 py-2 dark:border-white/25"
          />
          {!isLogin && <span className="mt-1 block text-xs text-black/50 dark:text-white/50">At least 8 characters.</span>}
        </label>
        {error && (
          <p role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-foreground px-4 py-2 text-background hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Please wait…" : isLogin ? "Log in" : "Sign up"}
        </button>
      </form>
      <p className="mt-4 text-sm text-black/60 dark:text-white/60">
        {isLogin ? "New here? " : "Already have an account? "}
        <Link href={otherHref} className="underline">
          {isLogin ? "Create an account" : "Log in"}
        </Link>
      </p>
    </div>
  );
}
