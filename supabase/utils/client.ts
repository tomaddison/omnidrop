import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../db.types";

export function browserClient() {
	return createBrowserClient<Database>(
		import.meta.env.VITE_SUPABASE_URL,
		import.meta.env.VITE_SUPABASE_ANON_KEY,
	);
}
