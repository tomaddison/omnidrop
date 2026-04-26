import { createServerFn } from "@tanstack/react-start";
import { createAuthClient } from "~/supabase/utils/server-auth";
import { LoginOtpSchema } from "../schema";

export const verifyLoginOtp = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => {
		const parsed = LoginOtpSchema.safeParse(data);
		if (!parsed.success) throw new Error("Invalid code.");
		return parsed.data;
	})
	.handler(async ({ data }) => {
		const supabase = createAuthClient();
		const { error } = await supabase.auth.verifyOtp({
			email: data.email,
			token: data.token,
			type: "email",
		});
		if (error) {
			throw new Error(error.message || "Invalid or expired code.");
		}
		return { ok: true as const };
	});
