import assert from "node:assert/strict";
import { after, test } from "node:test";
import { pool, redis } from "../db/client.js";
import { __testables } from "./auth.js";

after(async () => {
  await Promise.allSettled([redis.quit(), pool.end()]);
});

test("resolveSsoLinkResolution prefers linked account over email match", () => {
  const result = __testables.resolveSsoLinkResolution({
    linkedUserId: "linked-user",
    existingUserId: "email-user",
  });

  assert.deepEqual(result, { type: "linked", userId: "linked-user" });
});

test("resolveSsoLinkResolution requires confirmation when existing email has no link", () => {
  const result = __testables.resolveSsoLinkResolution({
    linkedUserId: null,
    existingUserId: "email-user",
  });

  assert.deepEqual(result, { type: "existing_user", userId: "email-user" });
});

test("resolveSsoLinkResolution creates new user when no link or email match exists", () => {
  const result = __testables.resolveSsoLinkResolution({
    linkedUserId: null,
    existingUserId: null,
  });

  assert.deepEqual(result, { type: "new_user" });
});

test("buildSsoLinkConfirmation sets expiry and carries normalized identity", () => {
  const now = new Date("2026-02-15T10:00:00.000Z");
  const confirmation = __testables.buildSsoLinkConfirmation(
    {
      provider: "oidc",
      providerSubject: "sub-123",
      email: "reader@example.com",
      displayName: "Reader",
    },
    {
      now,
      createToken: () => "fixed-token",
    },
  );

  assert.equal(confirmation.token, "fixed-token");
  assert.equal(confirmation.provider, "oidc");
  assert.equal(confirmation.providerSubject, "sub-123");
  assert.equal(confirmation.email, "reader@example.com");
  assert.equal(confirmation.displayName, "Reader");
  assert.equal(confirmation.expiresAt.toISOString(), "2026-02-15T10:10:00.000Z");
});
