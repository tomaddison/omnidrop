import {
	AbortMultipartUploadCommand,
	CompleteMultipartUploadCommand,
	DeleteObjectCommand,
	HeadObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createServiceClient } from "../../../../../../supabase/utils/server";
import { createAuthClient } from "../../../../../../supabase/utils/server-auth";

const schema = z.object({
	transferId: z.string().uuid(),
	fileId: z.string().uuid(),
	uploadId: z.string().min(1),
	parts: z
		.array(
			z.object({
				ETag: z.string().min(1),
				PartNumber: z.number().int().min(1),
			}),
		)
		.min(1),
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

export const completeMultipartFn = createServerFn({ method: "POST" })
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

		const { data: file, error: fetchError } = await supabase
			.from("transfer_files")
			.select("s3_key, file_size, transfers!inner(sender_user_id)")
			.eq("id", data.fileId)
			.eq("transfer_id", data.transferId)
			.single();

		if (fetchError || !file) {
			throw new Error("Transfer file not found.");
		}

		// Supabase FK joins come back as object or array depending on the shape.
		const transferRow = Array.isArray(file.transfers)
			? file.transfers[0]
			: file.transfers;
		if (!transferRow || transferRow.sender_user_id !== userId) {
			throw new Error("Not authorized to complete this upload.");
		}

		const bucket = process.env.S3_BUCKET ?? "omnidrop-transfers";
		const parts = [...data.parts].sort((a, b) => a.PartNumber - b.PartNumber);

		try {
			await s3.send(
				new CompleteMultipartUploadCommand({
					Bucket: bucket,
					Key: file.s3_key,
					UploadId: data.uploadId,
					MultipartUpload: { Parts: parts },
				}),
			);
		} catch (err) {
			// Lifecycle rule also sweeps these; abort here is just eager cleanup.
			try {
				await s3.send(
					new AbortMultipartUploadCommand({
						Bucket: bucket,
						Key: file.s3_key,
						UploadId: data.uploadId,
					}),
				);
			} catch {}
			throw err instanceof Error
				? err
				: new Error("Failed to complete upload.");
		}

		// Verify the uploaded object matches the size declared at create-transfer time.
		// Without this, a client could declare 1KB and ship arbitrary multi-GiB parts.
		const head = await s3.send(
			new HeadObjectCommand({ Bucket: bucket, Key: file.s3_key }),
		);
		const actualSize = head.ContentLength ?? -1;
		if (actualSize !== file.file_size) {
			await s3
				.send(new DeleteObjectCommand({ Bucket: bucket, Key: file.s3_key }))
				.catch(() => {});
			throw new Error("Upload size did not match the declared file size.");
		}

		return { success: true as const };
	});
