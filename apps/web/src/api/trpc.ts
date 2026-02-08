import type { AppRouter } from "@obelus/api";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

const resolveApiBaseUrl = (): string => {
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

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${resolveApiBaseUrl()}/trpc`,
      transformer: superjson,
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
        });
      },
    }),
  ],
});
