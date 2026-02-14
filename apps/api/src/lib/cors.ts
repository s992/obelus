import { env } from "./env.js";

const configuredOrigins = (env.APP_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

const allowedOrigins = new Set([
  env.APP_ORIGIN,
  ...configuredOrigins,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://[::1]:5173",
]);

const isPrivateNetworkHostname = (hostname: string): boolean => {
  const segments = hostname.split(".").map((part) => Number(part));
  if (
    segments.length !== 4 ||
    segments.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return false;
  }

  const a = segments[0];
  const b = segments[1];
  if (a === undefined || b === undefined) {
    return false;
  }

  return (
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
  );
};

export const normalizeOriginHeader = (origin: string | string[] | undefined): string | null => {
  if (typeof origin === "string") {
    return origin;
  }

  if (Array.isArray(origin) && origin.length > 0) {
    return origin[0] ?? null;
  }

  return null;
};

export const isAllowedOrigin = (origin: string): boolean => {
  if (allowedOrigins.has(origin)) {
    return true;
  }

  try {
    const parsed = new URL(origin);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }

    return (
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "[::1]" ||
      isPrivateNetworkHostname(parsed.hostname)
    );
  } catch {
    return false;
  }
};

export const resolveAllowedOriginForHeader = (
  originHeader: string | string[] | undefined,
): string | null => {
  const origin = normalizeOriginHeader(originHeader);
  if (!origin) {
    return null;
  }

  return isAllowedOrigin(origin) ? origin : null;
};
