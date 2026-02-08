import assert from "node:assert/strict";
import test from "node:test";
import { normalizeEmail } from "./email.js";

test("normalizeEmail trims and lowercases input", () => {
  assert.equal(normalizeEmail("  User.Name+tag@Example.COM "), "user.name+tag@example.com");
});
