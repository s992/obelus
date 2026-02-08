import { and, eq, gt, isNull } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { db } from "../db/client.js";
import { sessions, users } from "../db/schema.js";
import { env } from "./env.js";

const secret = new TextEncoder().encode(env.SESSION_SECRET);

export const issueSessionToken = async (sessionId: string, userId: string): Promise<string> => {
  return new SignJWT({ sid: sessionId, sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
};

export const verifySessionToken = async (
  token: string,
): Promise<{ sid: string; sub: string } | null> => {
  try {
    const { payload } = await jwtVerify(token, secret);
    const sid = payload.sid;
    const sub = payload.sub;
    if (typeof sid !== "string" || typeof sub !== "string") {
      return null;
    }
    return { sid, sub };
  } catch {
    return null;
  }
};

export const resolveCurrentUser = async (token: string | undefined) => {
  if (!token) {
    return null;
  }

  const parsed = await verifySessionToken(token);
  if (!parsed) {
    return null;
  }

  const [sessionRecord] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.id, parsed.sid),
        eq(sessions.userId, parsed.sub),
        gt(sessions.expiresAt, new Date()),
        isNull(sessions.revokedAt),
      ),
    )
    .limit(1);

  if (!sessionRecord) {
    return null;
  }

  const [userRecord] = await db.select().from(users).where(eq(users.id, parsed.sub)).limit(1);
  return userRecord ?? null;
};
