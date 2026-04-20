"use server";

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createServiceClient } from "../../../../supabase/utils/server";

const schema = z.object({ slug: z.string().min(1).max(64) });

export const getTransferFn = createServerFn({ method: "GET" })
	.inputValidator((data: unknown) => schema.parse(data))
	.handler(async ({ data }) => {
		const supabase = createServiceClient();

		const { data: transfer, error } = await supabase
			.from("transfers")
			.select(
				"id, slug, title, message, sender_email, expires_at, status, transfer_files(id, relative_path, file_size)",
			)
			.eq("slug", data.slug)
			.single();

		if (error || !transfer) throw new Error("Transfer not found.");
		if (transfer.status !== "ready") throw new Error("Transfer is not ready.");
		if (transfer.expires_at && new Date(transfer.expires_at) < new Date()) {
			throw new Error("This transfer has expired.");
		}

		return {
			id: transfer.id,
			slug: transfer.slug,
			title: transfer.title,
			message: transfer.message,
			senderEmail: transfer.sender_email,
			expiresAt: transfer.expires_at,
			files: transfer.transfer_files.map((f) => ({
				id: f.id,
				name: f.relative_path,
				size: f.file_size,
			})),
		};
	});
