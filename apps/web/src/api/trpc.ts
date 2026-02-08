import type { AppRouter } from "@obelus/api";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

const resolveApiBaseUrl = (): string => {
  const runtimeConfigured =
    typeof window !== "undefined" ? window.__OBELUS_CONFIG__?.API_BASE_URL : undefined;
  if (runtimeConfigured && runtimeConfigured.trim().length > 0) {
    return runtimeConfigured;
  }

  const configured = import.meta.env.VITE_API_URL;
  if (configured && configured.trim().length > 0) {
    return configured;
  }

  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "https:" : "http:";
    return `${protocol}//${window.location.hostname}:4000`;
  }

  return "http://localhost:4000";
};

let csrfToken: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;

const resolveCsrfToken = async (): Promise<string> => {
  if (csrfToken) {
    return csrfToken;
  }
  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }

  csrfTokenPromise = fetch(`${resolveApiBaseUrl()}/csrf`, {
    credentials: "include",
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Failed to initialize CSRF token.");
      }
      const payload = (await response.json()) as { token?: unknown };
      if (typeof payload.token !== "string" || payload.token.length === 0) {
        throw new Error("Invalid CSRF token payload.");
      }
      csrfToken = payload.token;
      return csrfToken;
    })
    .finally(() => {
      csrfTokenPromise = null;
    });

  return csrfTokenPromise;
};

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${resolveApiBaseUrl()}/trpc`,
      transformer: superjson,
      async fetch(url, options) {
        const headers = new Headers(options?.headers);
        try {
          headers.set("x-csrf-token", await resolveCsrfToken());
        } catch {
          // Server will reject protected mutations if token initialization failed.
        }

        return fetch(url, {
          ...options,
          headers,
          credentials: "include",
        });
      },
    }),
  ],
});
