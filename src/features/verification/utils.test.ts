import { beforeAll, describe, expect, it } from "vitest";
import {
	encodeCodeHash,
	generateOtp,
	hashOtp,
	signUploadToken,
	verifyOtp,
	verifyUploadToken,
} from "./utils";

describe("generateOtp", () => {
	it("returns a 6-character string", () => {
		const otp = generateOtp();
		expect(otp).toHaveLength(6);
	});

	it("returns only digits", () => {
		const otp = generateOtp();
		expect(/^\d{6}$/.test(otp)).toBe(true);
	});

	it("pads single-digit remainders with leading zeros", () => {
		// generateOtp is random, but we can verify the contract holds over many runs
		for (let i = 0; i < 20; i++) {
			expect(generateOtp()).toHaveLength(6);
		}
	});
});

describe("hashOtp / verifyOtp", () => {
	it("verifies the correct OTP against its hash", async () => {
		const otp = "123456";
		const { salt, hash } = await hashOtp(otp);
		const encoded = encodeCodeHash(salt, hash);
		expect(await verifyOtp(otp, encoded)).toBe(true);
	});

	it("rejects an incorrect OTP", async () => {
		const otp = "123456";
		const { salt, hash } = await hashOtp(otp);
		const encoded = encodeCodeHash(salt, hash);
		expect(await verifyOtp("654321", encoded)).toBe(false);
	});

	it("rejects a malformed code hash with no colon", async () => {
		expect(await verifyOtp("123456", "nocolon")).toBe(false);
	});

	it("produces different hashes for the same OTP on each call (salt is random)", async () => {
		const otp = "000000";
		const a = await hashOtp(otp);
		const b = await hashOtp(otp);
		expect(encodeCodeHash(a.salt, a.hash)).not.toBe(
			encodeCodeHash(b.salt, b.hash),
		);
	});
});

describe("encodeCodeHash", () => {
	it("produces a string in the format salt:hash", () => {
		const result = encodeCodeHash("mysalt", "myhash");
		expect(result).toBe("mysalt:myhash");
	});
});

describe("signUploadToken / verifyUploadToken", () => {
	beforeAll(() => {
		process.env.UPLOAD_TOKEN_SECRET =
			"test-secret-that-is-long-enough-for-hs256";
	});

	it("round-trips an email through sign then verify", async () => {
		const email = "user@example.com";
		const token = await signUploadToken(email);
		const claims = await verifyUploadToken(token);
		expect(claims.email).toBe(email);
	});

	it("rejects a tampered token", async () => {
		const token = await signUploadToken("user@example.com");
		const tampered = token.slice(0, -4) + "xxxx";
		await expect(verifyUploadToken(tampered)).rejects.toThrow();
	});

	it("rejects a token signed with a different secret", async () => {
		const token = await signUploadToken("user@example.com");
		// Temporarily swap the secret
		process.env.UPLOAD_TOKEN_SECRET = "totally-different-secret-value-xx";
		await expect(verifyUploadToken(token)).rejects.toThrow();
		// Restore
		process.env.UPLOAD_TOKEN_SECRET =
			"test-secret-that-is-long-enough-for-hs256";
	});
});
