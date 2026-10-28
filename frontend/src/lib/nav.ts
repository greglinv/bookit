// Only allow same-site relative redirects (blocks "https://evil.com" and "//evil.com").
export function safeNext(next: string | null, fallback = "/"): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
