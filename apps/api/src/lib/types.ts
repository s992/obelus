import type { users } from "../db/schema.js";

export type Context = {
  ip: string;
  user: typeof users.$inferSelect | null;
  sessionId: string | null;
  csrfToken: string;
  requestCsrfToken: string | null;
  setCookie: (token: string) => void;
  clearCookie: () => void;
};
