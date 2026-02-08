import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const KEYLEN = 64;
const SCRYPT_N = 16_384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const scryptAsync = (
  password: string,
  salt: string,
  keylen: number,
  options: { N: number; r: number; p: number },
): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derivedKey as Buffer);
    });
  });

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16).toString("hex");
  const hash = await scryptAsync(password, salt, KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  const params = `N=${SCRYPT_N},r=${SCRYPT_R},p=${SCRYPT_P}`;
  return `scrypt$${params}$${salt}$${hash.toString("hex")}`;
};

type ParsedHash = {
  salt: string;
  hash: string;
  params: { N: number; r: number; p: number };
};

const parseStoredHash = (storedHash: string): ParsedHash | null => {
  const parts = storedHash.split("$");
  if (parts.length === 4 && parts[0] === "scrypt") {
    const paramPairs = parts[1]?.split(",") ?? [];
    const paramMap = new Map(paramPairs.map((pair) => pair.split("=") as [string, string]));
    const n = Number(paramMap.get("N"));
    const r = Number(paramMap.get("r"));
    const p = Number(paramMap.get("p"));
    if (
      !parts[2] ||
      !parts[3] ||
      !Number.isInteger(n) ||
      !Number.isInteger(r) ||
      !Number.isInteger(p)
    ) {
      return null;
    }
    return {
      salt: parts[2],
      hash: parts[3],
      params: { N: n, r, p },
    };
  }

  // Backward compatibility with legacy "salt:hash" records.
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) {
    return null;
  }
  return {
    salt,
    hash,
    params: { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P },
  };
};

export const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
  const parsed = parseStoredHash(storedHash);
  if (!parsed) {
    return false;
  }

  const computedHash = await scryptAsync(password, parsed.salt, KEYLEN, {
    N: parsed.params.N,
    r: parsed.params.r,
    p: parsed.params.p,
  });
  const originalBuffer = Buffer.from(parsed.hash, "hex");

  if (computedHash.byteLength !== originalBuffer.byteLength) {
    return false;
  }

  return timingSafeEqual(computedHash, originalBuffer);
};
