import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const KEY = Buffer.from(
  process.env.ENCRYPTION_KEY ?? "0".repeat(64),
  "hex"
);
const ALGO = "aes-256-gcm";

/** 개인정보 AES-256-GCM 암호화 */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // iv(12) + tag(16) + ciphertext → base64
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

/** 복호화 */
export function decrypt(ciphertext: string): string {
  const buf = Buffer.from(ciphertext, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final("utf8");
}

/** 계좌번호 마스킹 (앞 2자리 + *** + 끝 4자리) */
export function maskAccount(account: string): string {
  if (account.length <= 6) return "****";
  return account.slice(0, 2) + "*".repeat(account.length - 6) + account.slice(-4);
}
