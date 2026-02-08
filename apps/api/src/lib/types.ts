import type { users } from "../db/schema.js";

export type Context = {
  user: typeof users.$inferSelect | null;
  setCookie: (token: string) => void;
  clearCookie: () => void;
};
