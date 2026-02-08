import { TRPCError } from "@trpc/server";
import { and, eq, gt, isNull, lt } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { oauthAccounts, oauthLoginStates, passwords, sessions, users } from "../db/schema.js";
import { issueSessionToken } from "../lib/auth.js";
import { normalizeEmail } from "../lib/email.js";
import { env, isSsoEnabled } from "../lib/env.js";
import { createSsoBeginPayload, resolveSsoIdentity } from "../lib/oidc.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { enforceAuthRateLimit } from "../lib/rate-limit.js";
import {
  csrfProtectedProcedure,
  csrfPublicProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from "../lib/trpc.js";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

const createSession = async (userId: string) => {
  const [session] = await db
    .insert(sessions)
    .values({
      userId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    })
    .returning();

  if (!session) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create session.",
    });
  }

  return session;
};

const isUniqueViolation = (error: unknown): boolean => {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      typeof error.code === "string" &&
      error.code === "23505",
  );
};

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

  csrfToken: publicProcedure.query(({ ctx }) => ({ token: ctx.csrfToken })),

  registerWithPassword: csrfPublicProcedure
    .input(
      z.object({
        email: z.string().email(),
        displayName: z.string().min(1).max(120),
        password: z.string().min(8),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const email = normalizeEmail(input.email);
      const displayName = input.displayName.trim();
      enforceAuthRateLimit(`${ctx.ip}:register:${email}`);

      let createdUserId: string;
      let createdSessionId: string;
      try {
        const passwordHash = await hashPassword(input.password);
        const created = await db.transaction(async (tx) => {
          const [createdUser] = await tx
            .insert(users)
            .values({
              email,
              displayName,
            })
            .returning();

          if (!createdUser) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create user.",
            });
          }

          await tx.insert(passwords).values({
            userId: createdUser.id,
            passwordHash,
          });

          const [session] = await tx
            .insert(sessions)
            .values({
              userId: createdUser.id,
              expiresAt: new Date(Date.now() + SESSION_TTL_MS),
            })
            .returning();
          if (!session) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create session.",
            });
          }

          return { userId: createdUser.id, sessionId: session.id };
        });
        createdUserId = created.userId;
        createdSessionId = created.sessionId;
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new TRPCError({ code: "CONFLICT", message: "Email already in use." });
        }
        throw error;
      }

      ctx.setCookie(await issueSessionToken(createdSessionId, createdUserId));
      return { userId: createdUserId };
    }),

  loginWithPassword: csrfPublicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const email = normalizeEmail(input.email);
      enforceAuthRateLimit(`${ctx.ip}:login:${email}`);

      const [userRecord] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!userRecord) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials." });
      }

      const [passwordRecord] = await db
        .select()
        .from(passwords)
        .where(eq(passwords.userId, userRecord.id))
        .limit(1);

      if (!passwordRecord || !(await verifyPassword(input.password, passwordRecord.passwordHash))) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials." });
      }

      const session = await createSession(userRecord.id);
      ctx.setCookie(await issueSessionToken(session.id, userRecord.id));
      return { userId: userRecord.id };
    }),

  logout: csrfProtectedProcedure
    .input(
      z
        .object({
          allSessions: z.boolean().optional(),
        })
        .optional(),
    )
    .mutation(async ({ ctx, input }) => {
      const allSessions = Boolean(input?.allSessions);
      if (allSessions) {
        await db
          .update(sessions)
          .set({ revokedAt: new Date() })
          .where(and(eq(sessions.userId, ctx.user.id), isNull(sessions.revokedAt)));
      } else if (ctx.sessionId) {
        await db
          .update(sessions)
          .set({ revokedAt: new Date() })
          .where(and(eq(sessions.id, ctx.sessionId), eq(sessions.userId, ctx.user.id)));
      }

      ctx.clearCookie();
      return { ok: true };
    }),

  changePassword: csrfProtectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(8),
        newPassword: z.string().min(8),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      enforceAuthRateLimit(`${ctx.ip}:change-password:${ctx.user.id}`);

      const [passwordRecord] = await db
        .select()
        .from(passwords)
        .where(eq(passwords.userId, ctx.user.id))
        .limit(1);

      if (
        !passwordRecord ||
        !(await verifyPassword(input.currentPassword, passwordRecord.passwordHash))
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect." });
      }

      const nextHash = await hashPassword(input.newPassword);
      const [newSession] = await db.transaction(async (tx) => {
        await tx
          .update(passwords)
          .set({ passwordHash: nextHash, updatedAt: new Date() })
          .where(eq(passwords.userId, ctx.user.id));

        await tx
          .update(sessions)
          .set({ revokedAt: new Date() })
          .where(and(eq(sessions.userId, ctx.user.id), isNull(sessions.revokedAt)));

        return tx
          .insert(sessions)
          .values({
            userId: ctx.user.id,
            expiresAt: new Date(Date.now() + SESSION_TTL_MS),
          })
          .returning();
      });

      if (!newSession) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create session.",
        });
      }

      ctx.setCookie(await issueSessionToken(newSession.id, ctx.user.id));
      return { ok: true };
    }),

  ssoConfig: publicProcedure.query(async () => {
    return {
      enabled: isSsoEnabled,
      authorizeUrl: env.OAUTH_AUTHORIZE_URL ?? null,
      tokenUrl: env.OAUTH_TOKEN_URL ?? null,
      userInfoUrl: env.OAUTH_USERINFO_URL ?? null,
      clientId: env.OAUTH_CLIENT_ID ?? null,
      note: "Set all required OAUTH_* variables to enable OAuth2/OIDC login.",
    };
  }),

  ssoBegin: publicProcedure.query(async ({ ctx }) => {
    enforceAuthRateLimit(`${ctx.ip}:sso-begin`);
    await db.delete(oauthLoginStates).where(lt(oauthLoginStates.expiresAt, new Date()));

    const payload = createSsoBeginPayload();
    await db.insert(oauthLoginStates).values({
      state: payload.state,
      nonce: payload.nonce,
      codeVerifier: payload.codeVerifier,
      expiresAt: payload.expiresAt,
    });

    return {
      authorizeUrl: payload.authorizeUrl,
      state: payload.state,
    };
  }),

  ssoCallback: csrfPublicProcedure
    .input(
      z.object({
        code: z.string().min(1),
        state: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      enforceAuthRateLimit(`${ctx.ip}:sso-callback`);
      await db.delete(oauthLoginStates).where(lt(oauthLoginStates.expiresAt, new Date()));

      const [stateRecord] = await db
        .select()
        .from(oauthLoginStates)
        .where(
          and(
            eq(oauthLoginStates.state, input.state),
            isNull(oauthLoginStates.usedAt),
            gt(oauthLoginStates.expiresAt, new Date()),
          ),
        )
        .limit(1);

      if (!stateRecord) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Invalid or expired SSO state." });
      }

      await db
        .update(oauthLoginStates)
        .set({ usedAt: new Date() })
        .where(eq(oauthLoginStates.state, stateRecord.state));

      const identity = await resolveSsoIdentity({
        code: input.code,
        codeVerifier: stateRecord.codeVerifier,
        nonce: stateRecord.nonce,
      });
      const email = normalizeEmail(identity.email);
      const displayName = identity.displayName.trim();

      const [linked] = await db
        .select()
        .from(oauthAccounts)
        .where(
          and(
            eq(oauthAccounts.provider, identity.provider),
            eq(oauthAccounts.providerSubject, identity.providerSubject),
          ),
        )
        .limit(1);

      const userId =
        linked?.userId ??
        (await db.transaction(async (tx) => {
          const [existingUser] = await tx
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
          const user =
            existingUser ??
            (
              await tx
                .insert(users)
                .values({
                  email,
                  displayName,
                })
                .returning()
            )[0];

          if (!user) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to resolve SSO user.",
            });
          }

          try {
            await tx.insert(oauthAccounts).values({
              userId: user.id,
              provider: identity.provider,
              providerSubject: identity.providerSubject,
            });
          } catch (error) {
            if (!isUniqueViolation(error)) {
              throw error;
            }
          }

          return user.id;
        }));

      const session = await createSession(userId);
      ctx.setCookie(await issueSessionToken(session.id, userId));
      return { userId };
    }),
});
