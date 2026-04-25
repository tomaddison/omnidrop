import { createServerClient } from "@supabase/ssr";
import {
	getCookies,
	setCookie,
} from "@tanstack/react-start/server";
import type { Database } from "../db.types";

// Per-request SSR client. Reads the session from the Cookie header and writes
// any rotated session cookies back via Set-Cookie. Only call inside server fns.
export function createAuthClient() {
	const url = process.env["VITE_SUPABASE_URL"];
	const anonKey = process.env["VITE_SUPABASE_ANON_KEY"];
	if (!url || !anonKey) {
		throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
	}
	return createServerClient<Database>(url, anonKey, {
		cookies: {
			getAll: () =>
				Object.entries(getCookies()).map(([name, value]) => ({ name, value })),
			setAll: (cookiesToSet) => {
				for (const { name, value, options } of cookiesToSet) {
					setCookie(name, value, options);
				}
			},
		},
	});
}
