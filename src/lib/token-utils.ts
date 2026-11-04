import { createHash, randomBytes } from "node:crypto";

/** Single-use links (email verification, password reset) carry a random token; only its hash is stored. */
export const hashToken = (raw: string) => createHash("sha256").update(raw).digest("hex");
export const newRawToken = () => randomBytes(32).toString("hex");
export const isTokenFormat = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
