import { randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, eq, gt, isNull, lt } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import {
  oauthAccounts,
  oauthLinkConfirmations,
  oauthLoginStates,
  passwords,
  sessions,
  users,
} from "../db/schema.js";
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
const SSO_LINK_CONFIRMATION_TTL_MS = 10 * 60 * 1000;

type SsoLinkResolution =
  | { type: "linked"; userId: string }
  | { type: "existing_user"; userId: string }
  | { type: "new_user" };

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

const randomBase64Url = (bytes: number): string => {
  return randomBytes(bytes).toString("base64url");
};

const resolveSsoLinkResolution = (input: {
  linkedUserId: string | null;
  existingUserId: string | null;
}): SsoLinkResolution => {
  if (input.linkedUserId) {
    return { type: "linked", userId: input.linkedUserId };
  }

  if (input.existingUserId) {
    return { type: "existing_user", userId: input.existingUserId };
  }

  return { type: "new_user" };
};

const buildSsoLinkConfirmation = (
  input: {
    provider: "oauth2" | "oidc";
    providerSubject: string;
    email: string;
    displayName: string;
  },
  options?: {
    now?: Date;
    createToken?: () => string;
  },
) => {
  const now = options?.now ?? new Date();
  return {
    token: options?.createToken?.() ?? randomBase64Url(32),
    provider: input.provider,
    providerSubject: input.providerSubject,
    email: input.email,
    displayName: input.displayName,
    expiresAt: new Date(now.getTime() + SSO_LINK_CONFIRMATION_TTL_MS),
  };
};

export const __testables = {
  resolveSsoLinkResolution,
  buildSsoLinkConfirmation,
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
      await Promise.all([
        db.delete(oauthLoginStates).where(lt(oauthLoginStates.expiresAt, new Date())),
        db.delete(oauthLinkConfirmations).where(lt(oauthLinkConfirmations.expiresAt, new Date())),
      ]);

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

      const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      const resolution = resolveSsoLinkResolution({
        linkedUserId: linked?.userId ?? null,
        existingUserId: existingUser?.id ?? null,
      });

      if (resolution.type === "linked") {
        const session = await createSession(resolution.userId);
        ctx.setCookie(await issueSessionToken(session.id, resolution.userId));
        return { userId: resolution.userId };
      }

      if (resolution.type === "existing_user") {
        const confirmation = buildSsoLinkConfirmation({
          provider: identity.provider,
          providerSubject: identity.providerSubject,
          email,
          displayName,
        });

        await db.insert(oauthLinkConfirmations).values(confirmation);

        return {
          requiresLinkConfirmation: true as const,
          linkToken: confirmation.token,
          email,
          provider: identity.provider,
        };
      }

      const userId = await db.transaction(async (tx) => {
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
            message: "Failed to resolve SSO user.",
          });
        }

        try {
          await tx.insert(oauthAccounts).values({
            userId: createdUser.id,
            provider: identity.provider,
            providerSubject: identity.providerSubject,
          });
        } catch (error) {
          if (!isUniqueViolation(error)) {
            throw error;
          }
        }

        return createdUser.id;
      });

      const session = await createSession(userId);
      ctx.setCookie(await issueSessionToken(session.id, userId));
      return { userId };
    }),

  confirmSsoLink: csrfPublicProcedure
    .input(
      z.object({
        linkToken: z.string().min(1),
        password: z.string().min(8),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      enforceAuthRateLimit(`${ctx.ip}:sso-confirm-link`);
      await db
        .delete(oauthLinkConfirmations)
        .where(lt(oauthLinkConfirmations.expiresAt, new Date()));

      const [linkRecord] = await db
        .select()
        .from(oauthLinkConfirmations)
        .where(
          and(
            eq(oauthLinkConfirmations.token, input.linkToken),
            isNull(oauthLinkConfirmations.usedAt),
            gt(oauthLinkConfirmations.expiresAt, new Date()),
          ),
        )
        .limit(1);

      if (!linkRecord) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Invalid or expired SSO link confirmation.",
        });
      }

      const [userRecord] = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizeEmail(linkRecord.email)))
        .limit(1);

      if (!userRecord) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Unable to complete account link.",
        });
      }

      const [passwordRecord] = await db
        .select()
        .from(passwords)
        .where(eq(passwords.userId, userRecord.id))
        .limit(1);

      if (!passwordRecord || !(await verifyPassword(input.password, passwordRecord.passwordHash))) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials." });
      }

      const session = await db.transaction(async (tx) => {
        const [activeToken] = await tx
          .update(oauthLinkConfirmations)
          .set({ usedAt: new Date() })
          .where(
            and(
              eq(oauthLinkConfirmations.token, input.linkToken),
              isNull(oauthLinkConfirmations.usedAt),
              gt(oauthLinkConfirmations.expiresAt, new Date()),
            ),
          )
          .returning();

        if (!activeToken) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Invalid or expired SSO link confirmation.",
          });
        }

        try {
          await tx.insert(oauthAccounts).values({
            userId: userRecord.id,
            provider: linkRecord.provider,
            providerSubject: linkRecord.providerSubject,
          });
        } catch (error) {
          if (!isUniqueViolation(error)) {
            throw error;
          }
        }

        const [createdSession] = await tx
          .insert(sessions)
          .values({
            userId: userRecord.id,
            expiresAt: new Date(Date.now() + SESSION_TTL_MS),
          })
          .returning();

        if (!createdSession) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create session.",
          });
        }

        return createdSession;
      });

      ctx.setCookie(await issueSessionToken(session.id, userRecord.id));
      return { userId: userRecord.id };
    }),
});
