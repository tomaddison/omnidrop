import { createServerFn } from "@tanstack/react-start";
import { createAuthClient } from "../../../../../supabase/utils/server-auth";
import { LoginSchema } from "../schema";

export const loginWithOtp = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => {
		const parsed = LoginSchema.safeParse(data);
		if (!parsed.success) throw new Error("Please enter a valid email.");
		return parsed.data;
	})
	.handler(async ({ data }) => {
		const supabase = createAuthClient();
		const { error } = await supabase.auth.signInWithOtp({
			email: data.email,
			options: {
				shouldCreateUser: true,
				captchaToken: data.captchaToken,
			},
		});
		if (error) {
			throw new Error(error.message || "Failed to send verification code.");
		}
		return { ok: true as const };
	});
