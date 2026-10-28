export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

interface ErrorBody {
  error?: string;
  issues?: { path: (string | number)[]; message: string }[];
}

function describeError(body: ErrorBody | null, status: number): string {
  if (body?.issues?.length) {
    return body.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ");
  }
  return body?.error ?? `Request failed (${status})`;
}

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(API_URL + path, {
    method: options.method ?? "GET",
    credentials: "include",
    cache: "no-store",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, describeError(data, res.status));
  return data as T;
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Something went wrong";
}
