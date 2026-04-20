"use server";

import { createServerFn } from "@tanstack/react-start";
import { Resend } from "resend";
import { z } from "zod";
import { OtpEmail } from "#/emails/otp";
import { applyGuards } from "#/features/security/server/guard";
import {
	encodeCodeHash,
	generateOtp,
	hashOtp,
} from "#/features/verification/utils";
import { createServiceClient } from "../../../../../../supabase/utils/server";

const schema = z.object({
	email: z.email(),
	turnstileToken: z.string().min(1),
});

export const requestOtp = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => schema.parse(data))
	.handler(async ({ data }) => {
		const { ip } = await applyGuards(data, {
			rateLimits: (d, { ip: clientIp }) => [
				{ bucket: `otp:ip:${clientIp}`, limit: 5, windowSeconds: 3600 },
				{ bucket: `otp:email:${d.email}`, limit: 3, windowSeconds: 3600 },
			],
		});

		const { email } = data;
		const supabase = createServiceClient();

		const otp = generateOtp();
		const { salt, hash } = await hashOtp(otp);
		const codeHash = encodeCodeHash(salt, hash);
		const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

		const { error } = await supabase.from("email_verifications").insert({
			email,
			code_hash: codeHash,
			expires_at: expiresAt,
			ip_address: ip === "unknown" ? null : ip,
		});

		if (error) {
			throw new Error("Failed to create verification. Please try again.");
		}

		const apiKey = process.env.RESEND_API_KEY;

		if (!apiKey || apiKey === "dev") {
			console.log(
				`\n\x1b[36m[OTP]\x1b[0m ${email} — code: \x1b[1m${otp}\x1b[0m\n`,
			);
		} else {
			const resend = new Resend(apiKey);
			const fromEmail = process.env.FROM_EMAIL ?? "no-reply@example.com";

			const { error: emailError } = await resend.emails.send({
				from: fromEmail,
				to: email,
				subject: "Your Omnidrop verification code",
				react: OtpEmail({ code: otp }),
			});

			if (emailError) throw new Error("Failed to send verification email.");
		}

		return { success: true as const };
	});
