import { handleCleanup } from "./handlers.ts";

// Supabase verifies the JWT signature at the platform level before this handler
// runs. We only need to inspect the already-verified role claim to ensure the
// caller is the internal cron job (service_role) and not an anon client.
function getJwtRole(req: Request): string | null {
	const auth = req.headers.get("Authorization");
	if (!auth?.startsWith("Bearer ")) return null;
	const parts = auth.slice(7).split(".");
	if (parts.length !== 3) return null;
	try {
		const payload = JSON.parse(atob(parts[1]));
		return typeof payload.role === "string" ? payload.role : null;
	} catch {
		return null;
	}
}

Deno.serve(async (req: Request) => {
	if (getJwtRole(req) !== "service_role") {
		return new Response(JSON.stringify({ error: "Forbidden" }), {
			status: 403,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		const result = await handleCleanup();
		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : "Unknown error";
		console.error("[cleanup-s3]", message);
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
});
