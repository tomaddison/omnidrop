import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";
import { createServiceClient } from "../../../../supabase/utils/server";

export type RateLimit = {
	bucket: string;
	limit: number;
	windowSeconds: number;
};

const TURNSTILE_VERIFY_URL =
	"https://challenges.cloudflare.com/turnstile/v0/siteverify";

type TurnstileVerifyResponse = {
	success?: boolean;
	"error-codes"?: string[];
};

// Identifier used when the request IP cannot be resolved (local tests, stray
// requests without a usable forwarded-for header). Rate limits still apply
// against this single synthetic bucket rather than leaking a global counter.
const UNKNOWN_IP = "unknown";

// createIsomorphicFn strips the server implementation (and its
// @tanstack/react-start/server import) from the client bundle, so this file
// remains safe to pull transitively from client code via "use server" modules.
//
// xForwardedFor: Vercel's edge network strips and re-sets X-Forwarded-For
// before requests reach the origin, so trusting it here is safe on Vercel.
// If the deployment platform ever changes, re-evaluate this flag.
export const extractIp = createIsomorphicFn()
	.client(() => UNKNOWN_IP)
	.server(() => getRequestIP({ xForwardedFor: true }) ?? UNKNOWN_IP);

export async function verifyTurnstileToken(
	token: string,
	ip: string,
): Promise<boolean> {
	const secret = process.env.TURNSTILE_SECRET_KEY;

	// Dev bypass: without a Turnstile secret configured the widget is not wired
	// up either; skipping verification lets local dev continue to work.
	if (!secret || secret === "dev") {
		if (process.env.NODE_ENV === "production") {
			throw new Error("TURNSTILE_SECRET_KEY must be set in production.");
		}
		return true;
	}

	const body = new URLSearchParams({
		secret,
		response: token,
		remoteip: ip,
	});

	const response = await fetch(TURNSTILE_VERIFY_URL, {
		method: "POST",
		body,
	});

	if (!response.ok) return false;
	const data: TurnstileVerifyResponse = await response.json();
	return data.success === true;
}

function readTurnstileToken(data: unknown): string | null {
	if (typeof data !== "object" || data === null) return null;
	const value = (data as Record<string, unknown>).turnstileToken;
	return typeof value === "string" && value.length > 0 ? value : null;
}

type ApplyGuardsOptions<TData> = {
	turnstile?: boolean;
	rateLimits: (data: TData, ctx: { ip: string }) => RateLimit[];
};

// Called from inside a createServerFn().handler() to run the shared bot-check
// and rate-limit pipeline. Returns the resolved IP so handlers can use it.
export async function applyGuards<TData>(
	data: TData,
	opts: ApplyGuardsOptions<TData>,
): Promise<{ ip: string }> {
	const ip = extractIp();

	if (opts.turnstile !== false) {
		const token = readTurnstileToken(data);
		if (!token) {
			throw new Error("Bot check failed. Please reload and try again.");
		}
		const ok = await verifyTurnstileToken(token, ip);
		if (!ok) {
			throw new Error("Bot check failed. Please reload and try again.");
		}
	}

	await enforceRateLimits(opts.rateLimits(data, { ip }));

	return { ip };
}

export async function enforceRateLimits(limits: RateLimit[]): Promise<void> {
	if (limits.length === 0) return;

	const supabase = createServiceClient();

	for (const { bucket, limit, windowSeconds } of limits) {
		const { data, error } = await supabase.rpc("check_and_record_rate_limit", {
			p_bucket: bucket,
			p_limit: limit,
			p_window_seconds: windowSeconds,
		});

		if (error) throw new Error("Rate limit check failed. Please try again.");

		if (data === false) {
			throw new Error(
				"Too many requests. Please wait a few minutes and try again.",
			);
		}
	}
}
