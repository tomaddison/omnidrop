"use server";

import { createServerFn } from "@tanstack/react-start";
import { Resend } from "resend";
import { z } from "zod";
import { TransferReadyEmail } from "#/emails/transfer-ready";
import { verifyUploadToken } from "#/features/verification/utils";
import { createServiceClient } from "../../../../../../supabase/utils/server";

const schema = z.object({
	token: z.string(),
	transferId: z.string().uuid(),
	expiryDays: z.number().int().min(1).max(7),
});

export const finalizeTransferFn = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => schema.parse(data))
	.handler(async ({ data }) => {
		const { email } = await verifyUploadToken(data.token);
		const supabase = createServiceClient();

		const { data: transfer, error: fetchError } = await supabase
			.from("transfers")
			.select(
				"id, slug, mode, sender_email, recipient_email, title, message, transfer_files(relative_path, file_size)",
			)
			.eq("id", data.transferId)
			.single();

		if (fetchError || !transfer) {
			throw new Error("Transfer not found.");
		}

		if (transfer.sender_email !== email) {
			throw new Error("Not authorized to finalize this transfer.");
		}

		const expiresAt = new Date(
			Date.now() + data.expiryDays * 86_400_000,
		).toISOString();

		const { error: updateError } = await supabase
			.from("transfers")
			.update({ status: "ready", expires_at: expiresAt })
			.eq("id", data.transferId);

		if (updateError) {
			throw new Error("Failed to finalize transfer.");
		}

		if (transfer.mode === "email" && transfer.recipient_email) {
			const appUrl = process.env.VITE_APP_URL ?? "";
			const downloadUrl = `${appUrl}/d/${transfer.slug}`;
			const apiKey = process.env.RESEND_API_KEY;
			const fromEmail = process.env.FROM_EMAIL ?? "no-reply@example.com";

			const files = transfer.transfer_files.map((f) => ({
				name: f.relative_path,
				size: f.file_size,
			}));

			if (!apiKey || apiKey === "dev") {
				console.log(
					`\n\x1b[36m[TRANSFER READY]\x1b[0m ${transfer.recipient_email} — download: \x1b[1m${downloadUrl}\x1b[0m\n`,
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
					}),
				});

				if (emailError) throw new Error("Failed to send recipient email.");
			}
		}

		return { success: true as const };
	});
