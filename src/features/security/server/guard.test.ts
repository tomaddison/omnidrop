import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { rpcMock } = vi.hoisted(() => ({
	rpcMock: vi.fn(),
}));

vi.mock("../../../../supabase/utils/server", () => ({
	createServiceClient: () => ({ rpc: rpcMock }),
}));

import { enforceRateLimits, verifyTurnstileToken } from "./guard";

describe("verifyTurnstileToken", () => {
	const ORIGINAL_FETCH = globalThis.fetch;

	beforeEach(() => {
		process.env.TURNSTILE_SECRET_KEY = "real-secret";
	});

	afterEach(() => {
		globalThis.fetch = ORIGINAL_FETCH;
		delete process.env.TURNSTILE_SECRET_KEY;
	});

	it("bypasses verification when TURNSTILE_SECRET_KEY is unset", async () => {
		delete process.env.TURNSTILE_SECRET_KEY;
		expect(await verifyTurnstileToken("any-token", "1.2.3.4")).toBe(true);
	});

	it("bypasses verification when secret is set to 'dev'", async () => {
		process.env.TURNSTILE_SECRET_KEY = "dev";
		expect(await verifyTurnstileToken("any-token", "1.2.3.4")).toBe(true);
	});

	it("throws in production when TURNSTILE_SECRET_KEY is unset", async () => {
		delete process.env.TURNSTILE_SECRET_KEY;
		process.env.NODE_ENV = "production";
		await expect(verifyTurnstileToken("any-token", "1.2.3.4")).rejects.toThrow(
			/TURNSTILE_SECRET_KEY must be set in production/,
		);
		process.env.NODE_ENV = "test";
	});

	it("throws in production when secret is set to 'dev'", async () => {
		process.env.TURNSTILE_SECRET_KEY = "dev";
		process.env.NODE_ENV = "production";
		await expect(verifyTurnstileToken("any-token", "1.2.3.4")).rejects.toThrow(
			/TURNSTILE_SECRET_KEY must be set in production/,
		);
		process.env.NODE_ENV = "test";
	});

	it("returns true when Cloudflare responds success:true", async () => {
		globalThis.fetch = vi.fn(
			async () =>
				new Response(JSON.stringify({ success: true }), { status: 200 }),
		) as typeof fetch;
		expect(await verifyTurnstileToken("token", "1.2.3.4")).toBe(true);
	});

	it("returns false when Cloudflare responds success:false", async () => {
		globalThis.fetch = vi.fn(
			async () =>
				new Response(JSON.stringify({ success: false }), { status: 200 }),
		) as typeof fetch;
		expect(await verifyTurnstileToken("token", "1.2.3.4")).toBe(false);
	});

	it("returns false when the siteverify call itself fails", async () => {
		globalThis.fetch = vi.fn(
			async () => new Response("boom", { status: 500 }),
		) as typeof fetch;
		expect(await verifyTurnstileToken("token", "1.2.3.4")).toBe(false);
	});

	it("submits secret, response and remoteip", async () => {
		const spy: typeof fetch = vi.fn(
			async () =>
				new Response(JSON.stringify({ success: true }), { status: 200 }),
		);
		globalThis.fetch = spy;

		await verifyTurnstileToken("mytoken", "9.9.9.9");

		const mock = vi.mocked(spy);
		const [, init] = mock.mock.calls[0] ?? [];
		if (!(init?.body instanceof URLSearchParams)) {
			throw new Error("Expected URLSearchParams body");
		}
		expect(init.body.get("secret")).toBe("real-secret");
		expect(init.body.get("response")).toBe("mytoken");
		expect(init.body.get("remoteip")).toBe("9.9.9.9");
	});
});

describe("enforceRateLimits", () => {
	beforeEach(() => {
		rpcMock.mockReset();
	});

	it("no-ops when there are no limits", async () => {
		await expect(enforceRateLimits([])).resolves.toBeUndefined();
		expect(rpcMock).not.toHaveBeenCalled();
	});

	it("records every configured bucket in order", async () => {
		rpcMock.mockResolvedValue({ data: true, error: null });

		await enforceRateLimits([
			{ bucket: "otp:ip:1.2.3.4", limit: 5, windowSeconds: 3600 },
			{ bucket: "otp:email:a@b.com", limit: 3, windowSeconds: 3600 },
		]);

		expect(rpcMock).toHaveBeenCalledTimes(2);
		expect(rpcMock).toHaveBeenNthCalledWith(1, "check_and_record_rate_limit", {
			p_bucket: "otp:ip:1.2.3.4",
			p_limit: 5,
			p_window_seconds: 3600,
		});
		expect(rpcMock).toHaveBeenNthCalledWith(2, "check_and_record_rate_limit", {
			p_bucket: "otp:email:a@b.com",
			p_limit: 3,
			p_window_seconds: 3600,
		});
	});

	it("throws when any bucket returns false", async () => {
		rpcMock
			.mockResolvedValueOnce({ data: true, error: null })
			.mockResolvedValueOnce({ data: false, error: null });

		await expect(
			enforceRateLimits([
				{ bucket: "a", limit: 1, windowSeconds: 60 },
				{ bucket: "b", limit: 1, windowSeconds: 60 },
			]),
		).rejects.toThrow(/too many requests/i);
	});

	it("throws a generic error when the RPC errors", async () => {
		rpcMock.mockResolvedValue({ data: null, error: { message: "boom" } });

		await expect(
			enforceRateLimits([{ bucket: "x", limit: 1, windowSeconds: 60 }]),
		).rejects.toThrow(/rate limit check failed/i);
	});
});
