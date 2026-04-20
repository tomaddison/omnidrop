import { createClient } from "npm:@supabase/supabase-js@2";
import { createS3Client, deleteS3Objects } from "./utils.ts";

export async function handleCleanup(): Promise<{
	processed: number;
	errors: string[];
}> {
	const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
	const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
	const bucket = Deno.env.get("S3_BUCKET") ?? "ht-transfers";

	const supabase = createClient(supabaseUrl, serviceRoleKey);
	const s3 = createS3Client();

	const { data: expired, error } = await supabase.rpc(
		"get_expired_transfers",
	);

	if (error) {
		throw new Error(`Failed to fetch expired transfers: ${error.message}`);
	}

	if (!expired || expired.length === 0) {
		return { processed: 0, errors: [] };
	}

	const errors: string[] = [];
	let processed = 0;

	for (const transfer of expired) {
		try {
			if (transfer.s3_keys && transfer.s3_keys.length > 0) {
				await deleteS3Objects(s3, bucket, transfer.s3_keys);
			}

			const { error: deleteError } = await supabase
				.from("transfers")
				.delete()
				.eq("id", transfer.id);

			if (deleteError) throw new Error(deleteError.message);

			processed++;
		} catch (err) {
			errors.push(
				`Transfer ${transfer.slug}: ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	}

	return { processed, errors };
}
