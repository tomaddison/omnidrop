"use server";

import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { createServerFn } from "@tanstack/react-start";
import { nanoid } from "nanoid";
import { z } from "zod";
import { applyGuards } from "#/features/security/server/guard";
import { MAX_TOTAL_BYTES, validateRelativePath } from "#/features/upload/utils";
import { verifyUploadToken } from "#/features/verification/utils";
import { createServiceClient } from "../../../../../../supabase/utils/server";

const PRESIGNED_POST_TTL_SECONDS = 15 * 60;

export const schema = z
	.object({
		token: z.string(),
		turnstileToken: z.string().min(1),
		mode: z.enum(["link", "email"]),
		expiryDays: z.number().int().min(1).max(7),
		recipientEmail: z.string().email().optional(),
		title: z.string().max(200).optional(),
		message: z.string().max(1000).optional(),
		files: z
			.array(
				z.object({
					name: z.string().min(1).max(500),
					relativePath: z.string().superRefine((val, ctx) => {
						const result = validateRelativePath(val);
						if (!result.ok) {
							ctx.addIssue({ code: "custom", message: result.reason });
						}
					}),
					size: z.number().int().nonnegative(),
				}),
			)
			.min(1)
			.max(250)
			.superRefine((files, ctx) => {
				const total = files.reduce((sum, f) => sum + f.size, 0);
				if (total > MAX_TOTAL_BYTES) {
					ctx.addIssue({
						code: "custom",
						message: "Transfer exceeds 2GB limit.",
					});
				}
			}),
	})
	.superRefine((data, ctx) => {
		if (data.mode === "email" && !data.recipientEmail) {
			ctx.addIssue({
				code: "custom",
				path: ["recipientEmail"],
				message: "Recipient email is required for email mode transfers.",
			});
		}
	});

const s3 = new S3Client({
	region: process.env.AWS_REGION ?? "eu-west-2",
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
	},
	requestChecksumCalculation: "WHEN_REQUIRED",
	responseChecksumValidation: "WHEN_REQUIRED",
	...(process.env.S3_ENDPOINT
		? { endpoint: process.env.S3_ENDPOINT, forcePathStyle: true }
		: {}),
});

export const createTransferFn = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => schema.parse(data))
	.handler(async ({ data }) => {
		const { ip } = await applyGuards(data, {
			rateLimits: (_d, { ip: clientIp }) => [
				{
					bucket: `create_transfer:ip:${clientIp}`,
					limit: 10,
					windowSeconds: 3600,
				},
			],
		});

		const { email } = await verifyUploadToken(data.token);

		// Per-sender daily bucket layered on top of the per-IP bucket.
		const supabase = createServiceClient();
		const { data: emailOk, error: emailLimitError } = await supabase.rpc(
			"check_and_record_rate_limit",
			{
				p_bucket: `create_transfer:email:${email}`,
				p_limit: 20,
				p_window_seconds: 86_400,
			},
		);
		if (emailLimitError) {
			throw new Error("Rate limit check failed. Please try again.");
		}
		if (emailOk === false) {
			throw new Error(
				"You've reached the daily transfer limit. Please try again tomorrow.",
			);
		}

		const slug = nanoid(8);

		const { data: transfer, error: transferError } = await supabase
			.from("transfers")
			.insert({
				slug,
				mode: data.mode,
				sender_email: email,
				sender_ip: ip === "unknown" ? null : ip,
				recipient_email: data.recipientEmail ?? null,
				title: data.title ?? null,
				message: data.message ?? null,
			})
			.select("id")
			.single();

		if (transferError || !transfer) {
			throw new Error("Failed to create transfer.");
		}

		const uploadUrls: {
			fileId: string;
			url: string;
			fields: Record<string, string>;
		}[] = [];

		const bucket = process.env.S3_BUCKET ?? "ht-transfers";

		for (const file of data.files) {
			const s3Key = `${slug}/${file.relativePath}`;

			const { data: fileRow, error: fileError } = await supabase
				.from("transfer_files")
				.insert({
					transfer_id: transfer.id,
					relative_path: file.relativePath,
					file_size: file.size,
					s3_key: s3Key,
				})
				.select("id")
				.single();

			if (fileError || !fileRow) {
				throw new Error("Failed to record transfer file.");
			}

			// Presigned POST (not PUT) so we can pin the upload size with
			// content-length-range. A PUT URL can't constrain body size, letting a
			// client smuggle an arbitrarily large object past our per-transfer limit.
			const { url, fields } = await createPresignedPost(s3, {
				Bucket: bucket,
				Key: s3Key,
				Expires: PRESIGNED_POST_TTL_SECONDS,
				Conditions: [
					["content-length-range", file.size, file.size],
					["eq", "$Content-Type", "application/octet-stream"],
				],
				Fields: {
					"Content-Type": "application/octet-stream",
				},
			});

			uploadUrls.push({ fileId: fileRow.id, url, fields });
		}

		return { transferId: transfer.id, slug, uploadUrls };
	});
