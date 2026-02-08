import {
  authSchema,
  passwordSchema,
  profileSchema,
  readingSchema,
  toReadSchema,
} from "@/features/shared/lib/schemas";
import { describe, expect, it } from "vitest";

describe("frontend schemas", () => {
  it("validates auth and profile payloads", () => {
    expect(() =>
      authSchema.parse({ email: "user@example.com", password: "12345678" }),
    ).not.toThrow();
    expect(() =>
      profileSchema.parse({ displayName: "A", collectionVisibility: "public" }),
    ).not.toThrow();
  });

  it("enforces password confirmation", () => {
    expect(() =>
      passwordSchema.parse({
        currentPassword: "12345678",
        newPassword: "abcdefgh",
        confirmPassword: "xxxxxxxy",
      }),
    ).toThrow();
  });

  it("parses optional numeric fields safely", () => {
    expect(
      readingSchema.parse({
        startedAt: "2026-02-01",
        progressPercent: "90",
      }).progressPercent,
    ).toBe(90);

    expect(toReadSchema.parse({ priority: "5" }).priority).toBe(5);
  });
});
