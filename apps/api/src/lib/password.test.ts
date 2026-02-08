import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, verifyPassword } from "./password.js";

test("hashPassword produces a verifiable hash", async () => {
  const hash = await hashPassword("correct horse battery staple");
  assert.equal(await verifyPassword("correct horse battery staple", hash), true);
  assert.equal(await verifyPassword("wrong password", hash), false);
});

test("verifyPassword supports legacy salt:hash format", async () => {
  const legacy = "b57b0ac5f8d7b1f4aa8974f8876d74ee:e3254d8db0f3612a05cc0b06657df7e90f9b8a4854f2082f3df43e26d3df7fdb2d5f8f85b2fbdb94e44d1d0c3f3a9b6d0d0d7e4d03f8b4ea0a6cc7ceca0562a8";
  assert.equal(await verifyPassword("wrong", legacy), false);
});
