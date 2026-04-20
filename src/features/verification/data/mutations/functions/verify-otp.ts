"use server";

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { applyGuards } from "#/features/security/server/guard";
import { signUploadToken, verifyOtp } from "#/features/verification/utils";
import { createServiceClient } from "../../../../../../supabase/utils/server";

const schema = z.object({
	email: z.email(),
	code: z.string().length(6),
});

const MAX_ATTEMPTS = 5;

export const verifyOtpFn = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => schema.parse(data))
	.handler(async ({ data }) => {
		await applyGuards(data, {
			turnstile: false,
			rateLimits: (_d, { ip }) => [
				{ bucket: `verify:ip:${ip}`, limit: 10, windowSeconds: 300 },
			],
		});

		const { email, code } = data;
		const supabase = createServiceClient();

		const { data: rows, error } = await supabase
			.from("email_verifications")
			.select("id, code_hash, expires_at, used, attempts")
			.eq("email", email)
			.eq("used", false)
			.gt("expires_at", new Date().toISOString())
			.order("created_at", { ascending: false })
			.limit(1);

		if (error || !rows || rows.length === 0) {
			throw new Error("Invalid or expired code.");
		}

		const row = rows[0];
		const valid = await verifyOtp(code, row.code_hash);

		if (!valid) {
			const nextAttempts = row.attempts + 1;
			const burn = nextAttempts >= MAX_ATTEMPTS;
			await supabase
				.from("email_verifications")
				.update({ attempts: nextAttempts, used: burn })
				.eq("id", row.id)
				.eq("used", false);

			// Add latency to slow rapid sequential brute-force attempts.
			await new Promise((r) => setTimeout(r, 500));

			if (burn) {
				throw new Error(
					"Too many incorrect attempts. Please request a new code.",
				);
			}
			throw new Error("Incorrect code. Please try again.");
		}

		// Atomic claim: UPDATE only succeeds if the row is still unused.
		// If two concurrent requests both pass verifyOtp(), only one wins here.
		const { data: claimed } = await supabase
			.from("email_verifications")
			.update({ used: true })
			.eq("id", row.id)
			.eq("used", false)
			.select("id");

		if (!claimed || claimed.length === 0) {
			throw new Error("Invalid or expired code.");
		}

		const token = await signUploadToken(email);
		return { token };
	});
