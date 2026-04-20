import { timingSafeEqual } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import type { UploadTokenClaims } from "#/features/verification/types";

// --- OTP generation & hashing ---

export function generateOtp(): string {
	const array = new Uint32Array(1);
	crypto.getRandomValues(array);
	return String(array[0] % 1_000_000).padStart(6, "0");
}

// Per-code salt prevents precomputed rainbow tables across rows and means a DB
// leak can't be cracked by hashing the 1M possible 6-digit codes once.
export async function hashOtp(
	otp: string,
): Promise<{ salt: string; hash: string }> {
	const salt = crypto.randomUUID();
	const encoded = new TextEncoder().encode(`${otp}:${salt}`);
	const buffer = await crypto.subtle.digest("SHA-256", encoded);
	const hash = Array.from(new Uint8Array(buffer))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	return { salt, hash };
}

// Stored format in DB: "salt:hash"
export function encodeCodeHash(salt: string, hash: string): string {
	return `${salt}:${hash}`;
}

export async function verifyOtp(
	otp: string,
	codeHash: string,
): Promise<boolean> {
	const colonIndex = codeHash.indexOf(":");
	if (colonIndex === -1) return false;
	const salt = codeHash.slice(0, colonIndex);
	const expectedHash = codeHash.slice(colonIndex + 1);
	const encoded = new TextEncoder().encode(`${otp}:${salt}`);
	const buffer = await crypto.subtle.digest("SHA-256", encoded);
	const submittedHash = Array.from(new Uint8Array(buffer))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	return timingSafeEqual(Buffer.from(submittedHash), Buffer.from(expectedHash));
}

// --- Upload token (JWT) ---

const ALGORITHM = "HS256";

function getTokenSecret(): Uint8Array {
	const secret = process.env.UPLOAD_TOKEN_SECRET;
	if (!secret) throw new Error("Missing UPLOAD_TOKEN_SECRET");
	return new TextEncoder().encode(secret);
}

export async function signUploadToken(email: string): Promise<string> {
	return new SignJWT({ email })
		.setProtectedHeader({ alg: ALGORITHM })
		.setIssuedAt()
		.setExpirationTime("1h")
		.sign(getTokenSecret());
}

export async function verifyUploadToken(
	token: string,
): Promise<UploadTokenClaims> {
	const { payload } = await jwtVerify(token, getTokenSecret());
	if (typeof payload.email !== "string") {
		throw new Error("Invalid token claims");
	}
	return { email: payload.email };
}
