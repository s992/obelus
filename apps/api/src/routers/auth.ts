import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { passwords, sessions, users } from "../db/schema.js";
import { issueSessionToken } from "../lib/auth.js";
import { env } from "../lib/env.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { protectedProcedure, publicProcedure, router } from "../lib/trpc.js";

export const authRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    return {
      id: ctx.user.id,
      email: ctx.user.email,
      displayName: ctx.user.displayName,
      collectionVisibility: ctx.user.collectionVisibility,
      createdAt: ctx.user.createdAt.toISOString(),
    };
  }),

  registerWithPassword: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        displayName: z.string().min(1),
        password: z.string().min(8),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Email already in use." });
      }

      const [createdUser] = await db
        .insert(users)
        .values({
          email: input.email,
          displayName: input.displayName,
        })
        .returning();
      if (!createdUser) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user." });
      }

      await db.insert(passwords).values({
        userId: createdUser.id,
        passwordHash: hashPassword(input.password),
      });

      const [session] = await db
        .insert(sessions)
        .values({
          userId: createdUser.id,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        })
        .returning();
      if (!session) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create session.",
        });
      }

      ctx.setCookie(await issueSessionToken(session.id, createdUser.id));

      return { userId: createdUser.id };
    }),

  loginWithPassword: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [userRecord] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);
      if (!userRecord) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials." });
      }

      const [passwordRecord] = await db
        .select()
        .from(passwords)
        .where(eq(passwords.userId, userRecord.id))
        .limit(1);

      if (!passwordRecord || !verifyPassword(input.password, passwordRecord.passwordHash)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials." });
      }

      const [session] = await db
        .insert(sessions)
        .values({
          userId: userRecord.id,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        })
        .returning();
      if (!session) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create session.",
        });
      }

      ctx.setCookie(await issueSessionToken(session.id, userRecord.id));

      return { userId: userRecord.id };
    }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    const cookie = ctx.user;
    if (cookie) {
      await db
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(and(eq(sessions.userId, cookie.id), isNull(sessions.revokedAt)));
    }
    ctx.clearCookie();
    return { ok: true };
  }),

  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(8),
        newPassword: z.string().min(8),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [passwordRecord] = await db
        .select()
        .from(passwords)
        .where(eq(passwords.userId, ctx.user.id))
        .limit(1);

      if (!passwordRecord || !verifyPassword(input.currentPassword, passwordRecord.passwordHash)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect." });
      }

      await db
        .update(passwords)
        .set({ passwordHash: hashPassword(input.newPassword) })
        .where(eq(passwords.userId, ctx.user.id));

      return { ok: true };
    }),

  ssoConfig: publicProcedure.query(async () => {
    return {
      enabled: Boolean(env.OAUTH_CLIENT_ID && env.OAUTH_AUTHORIZE_URL && env.OAUTH_REDIRECT_URI),
      authorizeUrl: env.OAUTH_AUTHORIZE_URL ?? null,
      tokenUrl: env.OAUTH_TOKEN_URL ?? null,
      userInfoUrl: env.OAUTH_USERINFO_URL ?? null,
      clientId: env.OAUTH_CLIENT_ID ?? null,
      note: "Set OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, OAUTH_AUTHORIZE_URL, OAUTH_TOKEN_URL, OAUTH_USERINFO_URL, OAUTH_REDIRECT_URI to enable OAuth2/OIDC login.",
    };
  }),

  ssoBegin: publicProcedure.query(async () => {
    if (!env.OAUTH_CLIENT_ID || !env.OAUTH_AUTHORIZE_URL || !env.OAUTH_REDIRECT_URI) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "OAuth2/OIDC is not configured in environment variables.",
      });
    }

    const state = randomUUID();
    const authorizeUrl = new URL(env.OAUTH_AUTHORIZE_URL);
    authorizeUrl.searchParams.set("client_id", env.OAUTH_CLIENT_ID);
    authorizeUrl.searchParams.set("redirect_uri", env.OAUTH_REDIRECT_URI);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("scope", env.OAUTH_SCOPES);
    authorizeUrl.searchParams.set("state", state);

    return { authorizeUrl: authorizeUrl.toString(), state };
  }),
});
