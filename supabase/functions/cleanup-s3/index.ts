import { handleCleanup } from "./handlers.ts";

Deno.serve(async (_req: Request) => {
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
