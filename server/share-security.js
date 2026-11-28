import crypto from "node:crypto";

export function createSharePassword(password) {
  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    const error = new Error("Share passwords must be between 8 and 128 characters.");
    error.status = 400;
    throw error;
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

export function verifySharePassword(password, salt, expectedHash) {
  if (typeof password !== "string" || typeof salt !== "string" || typeof expectedHash !== "string") return false;
  if (!salt || !/^[a-f0-9]{32}$/i.test(salt) || !/^[a-f0-9]{128}$/i.test(expectedHash) || password.length > 128) return false;
  const actual = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
