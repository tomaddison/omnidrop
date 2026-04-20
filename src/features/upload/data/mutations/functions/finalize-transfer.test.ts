import { beforeEach, describe, expect, it, vi } from "vitest";

const { fromMock, verifyUploadTokenMock } = vi.hoisted(() => ({
	fromMock: vi.fn(),
	verifyUploadTokenMock: vi.fn(),
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

vi.mock("resend", () => ({ Resend: vi.fn() }));
vi.mock("#/emails/transfer-ready", () => ({ TransferReadyEmail: vi.fn() }));

vi.mock("#/features/verification/utils", () => ({
	verifyUploadToken: verifyUploadTokenMock,
}));

vi.mock("../../../../../../supabase/utils/server", () => ({
	createServiceClient: () => ({ from: fromMock }),
}));

import { finalizeTransferFn } from "./finalize-transfer";

function queryChain(value: unknown) {
	const chain: Record<string, unknown> = {};
	for (const m of ["select", "update", "eq", "single"]) {
		chain[m] = vi.fn().mockReturnValue(chain);
	}
	chain.then = (
		resolve: (v: unknown) => unknown,
		reject?: (e: unknown) => unknown,
	) => Promise.resolve(value).then(resolve, reject);
	return chain;
}

const BASE_TRANSFER = {
	id: "transfer-id",
	slug: "abcd1234",
	mode: "link",
	sender_email: "owner@example.com",
	recipient_email: null,
	title: null,
	message: null,
	transfer_files: [],
};

const VALID_INPUT = {
	data: { token: "jwt", transferId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", expiryDays: 3 },
};

describe("finalizeTransferFn handler", () => {
	beforeEach(() => {
		fromMock.mockReset();
		verifyUploadTokenMock.mockReset();
	});

	it("throws when the token email does not match the transfer owner", async () => {
		verifyUploadTokenMock.mockResolvedValue({ email: "other@example.com" });
		fromMock.mockReturnValueOnce(
			queryChain({ data: BASE_TRANSFER, error: null }),
		);

		await expect((finalizeTransferFn as Function)(VALID_INPUT)).rejects.toThrow(
			/not authorized/i,
		);
	});

	it("returns success without resending when already finalized", async () => {
		verifyUploadTokenMock.mockResolvedValue({ email: "owner@example.com" });
		fromMock
			.mockReturnValueOnce(queryChain({ data: BASE_TRANSFER, error: null }))
			.mockReturnValueOnce(queryChain({ data: [], error: null })); // UPDATE matched 0 rows

		const result = await (finalizeTransferFn as Function)(VALID_INPUT);
		expect(result).toEqual({ success: true });
	});

	it("throws when the transfer is not found", async () => {
		verifyUploadTokenMock.mockResolvedValue({ email: "owner@example.com" });
		fromMock.mockReturnValueOnce(
			queryChain({ data: null, error: { message: "not found" } }),
		);

		await expect((finalizeTransferFn as Function)(VALID_INPUT)).rejects.toThrow(
			/transfer not found/i,
		);
	});
});
