import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEYLEN = 64;

export const hashPassword = (password: string): string => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEYLEN).toString("hex");
  return `${salt}:${hash}`;
};

export const verifyPassword = (password: string, storedHash: string): boolean => {
  const [salt, originalHash] = storedHash.split(":");
  if (!salt || !originalHash) {
    return false;
  }

  const computedHash = scryptSync(password, salt, KEYLEN);
  const originalBuffer = Buffer.from(originalHash, "hex");

  if (computedHash.byteLength !== originalBuffer.byteLength) {
    return false;
  }

  return timingSafeEqual(computedHash, originalBuffer);
};
