import { createClient } from "@supabase/supabase-js";
import type { Database } from "../db.types";

// Service-role client - only use inside server functions, never expose to the client.
export function createServiceClient() {
	const url = process.env["VITE_SUPABASE_URL"];
	const key = process.env["SUPABASE_SECRET_KEY"];
	if (!url || !key)
		throw new Error("Missing VITE_SUPABASE_URL or SUPABASE_SECRET_KEY");
	return createClient<Database>(url, key, {
		auth: { persistSession: false },
	});
}
