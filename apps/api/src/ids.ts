import { createHash, randomBytes } from "node:crypto";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function randomCode(length: number): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

export function createRoomCode(): string {
  return randomCode(6);
}

export function createRecoveryCode(): string {
  return `${randomCode(4)}-${randomCode(4)}`;
}

export function createToken(): string {
  return randomBytes(24).toString("hex");
}

export function hashSecret(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function createId(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}
