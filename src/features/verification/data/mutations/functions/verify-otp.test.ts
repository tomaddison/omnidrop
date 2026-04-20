import { beforeEach, describe, expect, it, vi } from "vitest";

const { fromMock, verifyOtpMock, signUploadTokenMock } = vi.hoisted(() => ({
	fromMock: vi.fn(),
	verifyOtpMock: vi.fn(),
	signUploadTokenMock: vi.fn(),
}));

vi.mock("@tanstack/react-start", () => ({
	createServerFn: () => {
		const obj: Record<string, unknown> = {};
		obj.inputValidator = () => obj;
		obj.handler = (fn: (ctx: { data: unknown }) => unknown) =>
			(input: { data: unknown }) => fn(input);
		return obj;
	},
}));

vi.mock("#/features/security/server/guard", () => ({
	applyGuards: vi.fn().mockResolvedValue({ ip: "1.2.3.4" }),
}));

vi.mock("#/features/verification/utils", () => ({
	verifyOtp: verifyOtpMock,
	signUploadToken: signUploadTokenMock,
}));

vi.mock("../../../../../../supabase/utils/server", () => ({
	createServiceClient: () => ({ from: fromMock }),
}));

import { verifyOtpFn } from "./verify-otp";

// Returns a PromiseLike chainable object that resolves to `value`.
// Each method call returns the same chain, so any query shape is supported.
function queryChain(value: unknown) {
	const chain: Record<string, unknown> = {};
	for (const m of [
		"select",
		"update",
		"eq",
		"gt",
		"order",
		"limit",
		"single",
	]) {
		chain[m] = vi.fn().mockReturnValue(chain);
	}
	chain.then = (
		resolve: (v: unknown) => unknown,
		reject?: (e: unknown) => unknown,
	) => Promise.resolve(value).then(resolve, reject);
	return chain;
}

const BASE_ROW = {
	id: "row-id-1",
	code_hash: "salt:hash",
	expires_at: new Date(Date.now() + 600_000).toISOString(),
	used: false,
	attempts: 0,
};

const VALID_INPUT = { data: { email: "user@example.com", code: "123456" } };

describe("verifyOtpFn handler", () => {
	beforeEach(() => {
		fromMock.mockReset();
		verifyOtpMock.mockReset();
		signUploadTokenMock.mockReset();
	});

	it("returns a signed token when the code is correct", async () => {
		fromMock
			.mockReturnValueOnce(queryChain({ data: [BASE_ROW], error: null }))
			.mockReturnValueOnce(
				queryChain({ data: [{ id: BASE_ROW.id }], error: null }),
			);
		verifyOtpMock.mockResolvedValue(true);
		signUploadTokenMock.mockResolvedValue("signed-token");

		const result = await (verifyOtpFn as Function)(VALID_INPUT);
		expect(result).toEqual({ token: "signed-token" });
	});

	it("throws and increments attempts on a wrong code", async () => {
		fromMock
			.mockReturnValueOnce(queryChain({ data: [BASE_ROW], error: null }))
			.mockReturnValueOnce(queryChain({ error: null }));
		verifyOtpMock.mockResolvedValue(false);

		await expect(
			(verifyOtpFn as Function)(VALID_INPUT),
		).rejects.toThrow(/incorrect code/i);
	}, 2000);

	it("burns the code on the 5th wrong attempt", async () => {
		const row = { ...BASE_ROW, attempts: 4 };
		fromMock
			.mockReturnValueOnce(queryChain({ data: [row], error: null }))
			.mockReturnValueOnce(queryChain({ error: null }));
		verifyOtpMock.mockResolvedValue(false);

		await expect(
			(verifyOtpFn as Function)(VALID_INPUT),
		).rejects.toThrow(/too many incorrect attempts/i);
	}, 2000);

	it("throws when the atomic claim finds the code already used (race condition)", async () => {
		fromMock
			.mockReturnValueOnce(queryChain({ data: [BASE_ROW], error: null }))
			.mockReturnValueOnce(queryChain({ data: [], error: null }));
		verifyOtpMock.mockResolvedValue(true);

		await expect((verifyOtpFn as Function)(VALID_INPUT)).rejects.toThrow(
			/invalid or expired/i,
		);
	});

	it("throws when no verification row exists", async () => {
		fromMock.mockReturnValueOnce(queryChain({ data: [], error: null }));

		await expect((verifyOtpFn as Function)(VALID_INPUT)).rejects.toThrow(
			/invalid or expired/i,
		);
	});
});
