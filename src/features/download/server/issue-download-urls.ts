import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createServiceClient } from "~/supabase/utils/server";
import { assertReady } from "./assert-ready";

const schema = z.object({
	slug: z.string().min(1).max(64),
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

export const issueDownloadUrlsFn = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => schema.parse(data))
	.handler(async ({ data }) => {
		const supabase = createServiceClient();

		const { data: transfer, error } = await supabase
			.from("transfers")
			.select(
				"id, status, expires_at, transfer_files(id, relative_path, s3_key)",
			)
			.eq("slug", data.slug)
			.single();

		assertReady(transfer, error);

		const urls = await Promise.all(
			transfer.transfer_files.map(async (file) => {
				const asciiName = file.relative_path
					.replace(/[^\x20-\x7e]/g, "_")
					.replace(/["\\]/g, "_");
				const command = new GetObjectCommand({
					Bucket: process.env.S3_BUCKET ?? "omnidrop-transfers",
					Key: file.s3_key,
					ResponseContentDisposition: `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(file.relative_path)}`,
					ResponseContentType: "application/octet-stream",
				});
				// 5-minute TTL: long enough for the browser to begin every file in a
				// multi-download batch, short enough that a leaked link decays fast.
				const url = await getSignedUrl(s3, command, { expiresIn: 300 });
				return { fileId: file.id, name: file.relative_path, url };
			}),
		);

		return { urls };
	});
