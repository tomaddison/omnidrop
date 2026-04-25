export function assertReady<
	T extends { status: string; expires_at: string | null },
>(transfer: T | null, queryError: unknown): asserts transfer is T {
	if (queryError || !transfer) throw new Error("Transfer not found.");
	if (transfer.status !== "ready") throw new Error("Transfer is not ready.");
	if (transfer.expires_at && new Date(transfer.expires_at) < new Date()) {
		throw new Error("This transfer has expired.");
	}
}
