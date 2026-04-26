import {
	CreateMultipartUploadCommand,
	S3Client,
	UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createServerFn } from "@tanstack/react-start";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
	MAX_TOTAL_BYTES,
	MAX_TRANSFER_LABEL,
	PART_SIZE,
	validateRelativePath,
} from "@/features/upload/utils";
import { createServiceClient } from "~/supabase/utils/server";
import { createAuthClient } from "~/supabase/utils/server-auth";

const PRESIGNED_PART_TTL_SECONDS = 60 * 60;
const MONTHLY_TRANSFER_LIMIT = 20;

export const schema = z
	.object({
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
						message: `Transfer exceeds ${MAX_TRANSFER_LABEL} limit.`,
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
		const auth = createAuthClient();
		const { data: claimsData, error: claimsError } =
			await auth.auth.getClaims();
		const claims = claimsData?.claims;

		if (claimsError || !claims?.sub || !claims.email) {
			throw new Error("Session expired. Please request a new code.");
		}
		const userId = claims.sub;
		const userEmail = claims.email;

		const supabase = createServiceClient();

		const slug = nanoid(16);

		const { data: quotaResult, error: quotaError } = await supabase
			.rpc("create_transfer_if_under_quota", {
				p_slug: slug,
				p_mode: data.mode,
				p_sender_user_id: userId,
				p_sender_email: userEmail,
				p_recipient_email: data.recipientEmail ?? "",
				p_title: data.title ?? "",
				p_message: data.message ?? "",
				p_monthly_limit: MONTHLY_TRANSFER_LIMIT,
			})
			.single();

		if (quotaError || !quotaResult) {
			throw new Error("Failed to create transfer.");
		}
		if (quotaResult.over_quota) {
			throw new Error(
				`You've used all ${MONTHLY_TRANSFER_LIMIT} transfers this month. Resets on the 1st.`,
			);
		}
		const transfer = { id: quotaResult.id as string };

		const uploadUrls: {
			fileId: string;
			uploadId: string;
			partUrls: string[];
		}[] = [];

		const bucket = process.env.S3_BUCKET ?? "omnidrop-transfers";

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

			// Multipart, not presigned POST — POST requires a single-request body (5 GB cap, full buffer).
			const { UploadId } = await s3.send(
				new CreateMultipartUploadCommand({
					Bucket: bucket,
					Key: s3Key,
					ContentType: "application/octet-stream",
				}),
			);
			if (!UploadId) {
				throw new Error("Failed to initiate multipart upload.");
			}

			const totalParts = Math.max(1, Math.ceil(file.size / PART_SIZE));
			const partUrls: string[] = [];
			for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
				const cmd = new UploadPartCommand({
					Bucket: bucket,
					Key: s3Key,
					UploadId,
					PartNumber: partNumber,
				});
				partUrls.push(
					await getSignedUrl(s3, cmd, {
						expiresIn: PRESIGNED_PART_TTL_SECONDS,
					}),
				);
			}

			uploadUrls.push({ fileId: fileRow.id, uploadId: UploadId, partUrls });
		}

		return { transferId: transfer.id, slug, uploadUrls };
	});
