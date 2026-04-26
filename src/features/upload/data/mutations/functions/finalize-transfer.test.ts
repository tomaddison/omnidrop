import { beforeEach, describe, expect, it, vi } from "vitest";

const { fromMock, getClaimsMock } = vi.hoisted(() => ({
	fromMock: vi.fn(),
	getClaimsMock: vi.fn(),
}));

vi.mock("@tanstack/react-start", () => ({
	createServerFn: () => {
		const obj: Record<string, unknown> = {};
		obj.inputValidator = () => obj;
		obj.handler =
			(fn: (ctx: { data: unknown }) => unknown) => (input: { data: unknown }) =>
				fn(input);
		return obj;
	},
}));

vi.mock("resend", () => ({ Resend: vi.fn() }));
vi.mock("@/emails/transfer-ready", () => ({ TransferReadyEmail: vi.fn() }));

vi.mock("../../../../../../supabase/utils/server-auth", () => ({
	createAuthClient: () => ({ auth: { getClaims: getClaimsMock } }),
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
	// biome-ignore lint/suspicious/noThenProperty: simulating a Supabase query builder that is also a thenable.
	chain.then = (
		resolve: (v: unknown) => unknown,
		reject?: (e: unknown) => unknown,
	) => Promise.resolve(value).then(resolve, reject);
	return chain;
}

const OWNER = { id: "user-owner", email: "owner@example.com" };
const OTHER = { id: "user-other", email: "other@example.com" };

const claimsFor = (u: { id: string; email: string } | null) =>
	u
		? { data: { claims: { sub: u.id, email: u.email } }, error: null }
		: { data: null, error: null };

const BASE_TRANSFER = {
	id: "transfer-id",
	slug: "abcd1234",
	mode: "link",
	sender_user_id: OWNER.id,
	sender_email: OWNER.email,
	recipient_email: null,
	title: null,
	message: null,
	transfer_files: [],
};

const VALID_INPUT = {
	data: {
		transferId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
		expiryDays: 3,
	},
};

describe("finalizeTransferFn handler", () => {
	beforeEach(() => {
		fromMock.mockReset();
		getClaimsMock.mockReset();
	});

	it("throws when the session user is not the transfer owner", async () => {
		getClaimsMock.mockResolvedValue(claimsFor(OTHER));
		fromMock.mockReturnValueOnce(
			queryChain({ data: BASE_TRANSFER, error: null }),
		);

		await expect((finalizeTransferFn as Function)(VALID_INPUT)).rejects.toThrow(
			/not authorized/i,
		);
	});

	it("returns success without resending when already finalized", async () => {
		getClaimsMock.mockResolvedValue(claimsFor(OWNER));
		fromMock
			.mockReturnValueOnce(queryChain({ data: BASE_TRANSFER, error: null }))
			.mockReturnValueOnce(queryChain({ data: [], error: null }));

		const result = await (finalizeTransferFn as Function)(VALID_INPUT);
		expect(result).toEqual({ success: true });
	});

	it("throws when the transfer is not found", async () => {
		getClaimsMock.mockResolvedValue(claimsFor(OWNER));
		fromMock.mockReturnValueOnce(
			queryChain({ data: null, error: { message: "not found" } }),
		);

		await expect((finalizeTransferFn as Function)(VALID_INPUT)).rejects.toThrow(
			/transfer not found/i,
		);
	});

	it("throws when there is no signed-in user", async () => {
		getClaimsMock.mockResolvedValue(claimsFor(null));

		await expect((finalizeTransferFn as Function)(VALID_INPUT)).rejects.toThrow(
			/session expired/i,
		);
	});
});
