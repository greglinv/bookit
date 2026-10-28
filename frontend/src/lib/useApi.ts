"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "./api";

interface State<T> {
  key: string;
  data?: T;
  error?: ApiError;
}

// Fetches `path` (null = don't fetch). Bump `version` to refetch.
// `data` only reflects the current request; `lastData` keeps the previous result while reloading.
export function useApi<T>(path: string | null, version = 0) {
  const key = path === null ? null : `${path}#${version}`;
  const [state, setState] = useState<State<T> | null>(null);

  useEffect(() => {
    if (key === null || path === null) return;
    let cancelled = false;
    api<T>(path)
      .then((data) => !cancelled && setState({ key, data }))
      .catch((error) => !cancelled && setState({ key, error }));
    return () => {
      cancelled = true;
    };
  }, [key, path]);

  const current = state && state.key === key ? state : null;
  return {
    data: current?.data,
    lastData: state?.data,
    error: current?.error,
    loading: key !== null && !current,
  };
}
