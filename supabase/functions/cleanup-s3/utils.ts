import {
	DeleteObjectsCommand,
	S3Client,
} from "npm:@aws-sdk/client-s3@3";

export function createS3Client(): S3Client {
	const endpoint = Deno.env.get("S3_ENDPOINT");
	return new S3Client({
		region: Deno.env.get("AWS_REGION") ?? "eu-west-2",
		credentials: {
			accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID")!,
			secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY")!,
		},
		...(endpoint ? { endpoint, forcePathStyle: true } : {}),
	});
}

export async function deleteS3Objects(
	s3: S3Client,
	bucket: string,
	keys: string[],
): Promise<void> {
	if (keys.length === 0) return;

	// DeleteObjects supports up to 1000 keys per request.
	for (let i = 0; i < keys.length; i += 1000) {
		const chunk = keys.slice(i, i + 1000);
		await s3.send(
			new DeleteObjectsCommand({
				Bucket: bucket,
				Delete: {
					Objects: chunk.map((Key) => ({ Key })),
					Quiet: true,
				},
			}),
		);
	}
}
