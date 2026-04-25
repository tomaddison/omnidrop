import { z } from "zod";

export type FormErrorField = "files" | "yourEmail" | "recipientEmail";

export type FormError = {
	field: FormErrorField;
	message: string;
} | null;

export const formSchema = z.discriminatedUnion("mode", [
	z.object({
		mode: z.literal("link"),
		yourEmail: z.email("Enter a valid email."),
	}),
	z.object({
		mode: z.literal("email"),
		yourEmail: z.email("Enter a valid email."),
		recipientEmail: z.email("Enter a valid recipient email."),
	}),
]);
