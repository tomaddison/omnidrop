import { z } from "zod";

export const LoginSchema = z.object({
	email: z.email(),
	captchaToken: z.string().min(1),
});

export const LoginOtpSchema = z.object({
	email: z.email(),
	token: z.string().length(6),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type LoginOtpInput = z.infer<typeof LoginOtpSchema>;
