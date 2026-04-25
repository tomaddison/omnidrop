import { TransferReadyEmail } from "#/emails/transfer-ready";
import { createServerFn } from "@tanstack/react-start";
import { Resend } from "resend";
import { z } from "zod";
import { createServiceClient } from "../../../../../../supabase/utils/server";
import { createAuthClient } from "../../../../../../supabase/utils/server-auth";

const schema = z.object({
	transferId: z.string().uuid(),
	expiryDays: z.number().int().min(1).max(7),
});

export const finalizeTransferFn = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => schema.parse(data))
	.handler(async ({ data }) => {
		const auth = createAuthClient();
		const { data: claimsData, error: claimsError } =
			await auth.auth.getClaims();
		const claims = claimsData?.claims;

		if (claimsError || !claims?.sub) {
			throw new Error("Session expired. Please sign in again.");
		}
		const userId = claims.sub;

		const supabase = createServiceClient();

		const { data: transfer, error: fetchError } = await supabase
			.from("transfers")
			.select(
				"id, slug, mode, sender_user_id, sender_email, recipient_email, title, message, transfer_files(relative_path, file_size)",
			)
			.eq("id", data.transferId)
			.single();

		if (fetchError || !transfer) {
			throw new Error("Transfer not found.");
		}

		if (transfer.sender_user_id !== userId) {
			throw new Error("Not authorized to finalize this transfer.");
		}

		const expiresAt = new Date(
			Date.now() + data.expiryDays * 86_400_000,
		).toISOString();

		// Idempotent: only the uploading → ready transition returns rows and triggers the email.
		const { data: updated, error: updateError } = await supabase
			.from("transfers")
			.update({ status: "ready", expires_at: expiresAt })
			.eq("id", data.transferId)
			.eq("sender_user_id", userId)
			.eq("status", "uploading")
			.select("id");

		if (updateError) {
			throw new Error("Failed to finalize transfer.");
		}

		if (!updated || updated.length === 0) {
			return { success: true as const };
		}

		if (transfer.mode === "email" && transfer.recipient_email) {
			const appUrl = process.env.VITE_APP_URL ?? "";
			const downloadUrl = `${appUrl}/d/${transfer.slug}`;
			const apiKey = process.env.RESEND_API_KEY;
			const fromEmail = process.env.FROM_EMAIL ?? "no-reply@example.com";

			if (process.env.NODE_ENV === "production" && (!apiKey || apiKey === "dev")) {
				throw new Error("RESEND_API_KEY must be set in production.");
			}

			const files = transfer.transfer_files.map((f) => ({
				name: f.relative_path,
				size: f.file_size,
			}));

			if (!apiKey || apiKey === "dev") {
				console.log(
					`\n\x1b[36m[TRANSFER READY]\x1b[0m ${transfer.recipient_email} - download: \x1b[1m${downloadUrl}\x1b[0m\n`,
				);
			} else {
				const resend = new Resend(apiKey);
				const { error: emailError } = await resend.emails.send({
					from: fromEmail,
					to: transfer.recipient_email,
					subject: `${transfer.sender_email} sent you files`,
					react: TransferReadyEmail({
						senderEmail: transfer.sender_email,
						title: transfer.title,
						message: transfer.message,
						files,
						downloadUrl,
						expiresAt,
						appUrl,
					}),
				});

				if (emailError) throw new Error("Failed to send recipient email.");
			}
		}

		return { success: true as const };
	});
