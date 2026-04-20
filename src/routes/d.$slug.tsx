import {
	Clock01Icon,
	Download01Icon,
	Tick02Icon,
} from "@hugeicons/core-free-icons";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { FileGlyph } from "#/components/ui/file-glyph";
import { HI } from "#/components/ui/hi";
import { TopBar } from "#/features/branding/top-bar";
import { getTransferFn } from "#/features/download/server/get-transfer";
import { issueDownloadUrlsFn } from "#/features/download/server/issue-download-urls";
import { formatBytes } from "#/lib/format";

export const Route = createFileRoute("/d/$slug")({
	loader: ({ params }) => getTransferFn({ data: { slug: params.slug } }),
	component: DownloadPage,
	errorComponent: DownloadErrorPage,
});

function formatExpiry(iso: string): string {
	const expires = new Date(iso);
	const now = new Date();
	const diffMs = expires.getTime() - now.getTime();
	const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
	if (days === 0) return "Expires today";
	if (days === 1) return "Expires tomorrow";
	return `Expires in ${days} days`;
}

function avatarInitial(email: string | null): string {
	if (!email) return "?";
	return email.slice(0, 1).toUpperCase();
}

function DownloadPage() {
	const transfer = Route.useLoaderData();
	const [urlCache, setUrlCache] = useState<Map<string, string>>(new Map());
	const [isFetchingAll, setIsFetchingAll] = useState(false);
	const [fetchingFileId, setFetchingFileId] = useState<string | null>(null);
	const [downloadedAll, setDownloadedAll] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const totalBytes = transfer.files.reduce((sum, f) => sum + f.size, 0);

	async function fetchUrls(): Promise<Map<string, string>> {
		if (urlCache.size === transfer.files.length) return urlCache;
		const { urls } = await issueDownloadUrlsFn({
			data: { slug: transfer.slug },
		});
		const next = new Map<string, string>();
		for (const u of urls) next.set(u.fileId, u.url);
		setUrlCache(next);
		return next;
	}

	async function handleDownloadOne(fileId: string) {
		setError(null);
		setFetchingFileId(fileId);
		try {
			const urls = await fetchUrls();
			const url = urls.get(fileId);
			if (url) window.open(url, "_blank");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Download failed.");
		} finally {
			setFetchingFileId(null);
		}
	}

	async function handleDownloadAll() {
		setError(null);
		setIsFetchingAll(true);
		try {
			const urls = await fetchUrls();
			for (const file of transfer.files) {
				const url = urls.get(file.id);
				if (url) window.open(url, "_blank");
			}
			setDownloadedAll(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Download failed.");
		} finally {
			setIsFetchingAll(false);
		}
	}

	return (
		<div className="relative min-h-screen">
			<TopBar />
			<main className="flex min-h-[calc(100vh-90px)] items-center justify-center px-5 py-10">
				<div className="ht-fade-in w-full max-w-[520px] rounded-3xl bg-surface-1 p-7">
					<div className="mb-5 flex items-center gap-3">
						<div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-3 text-xs font-medium text-fg-2">
							{avatarInitial(transfer.senderEmail)}
						</div>
						<div className="min-w-0">
							<div className="truncate text-xs text-fg-3">
								From {transfer.senderEmail ?? "Omnidrop"}
							</div>
							{transfer.title && (
								<div className="mt-0.5 truncate text-sm font-medium text-fg-0">
									{transfer.title}
								</div>
							)}
						</div>
					</div>

					<div className="font-serif-italic mb-1.5 text-[32px] leading-[1.15] tracking-[-0.02em] text-fg-0">
						{transfer.files.length}{" "}
						{transfer.files.length === 1 ? "file" : "files"}, ready when you
						are.
					</div>
					<div className="mb-5 flex flex-wrap items-center gap-x-2 text-[13px] text-fg-3">
						<span>{formatBytes(totalBytes)} total</span>
						{transfer.expiresAt && (
							<>
								<span>·</span>
								<span className="inline-flex items-center gap-1.5">
									<HI icon={Clock01Icon} size={12} />
									{formatExpiry(transfer.expiresAt)}
								</span>
							</>
						)}
					</div>

					<div className="max-h-[260px] overflow-y-auto overflow-x-hidden rounded-2xl bg-surface-2">
						{transfer.files.map((file, i) => (
							<div
								key={file.id}
								className="flex items-center gap-3 px-3.5 py-3"
								style={{
									borderTop: i === 0 ? "none" : "1px solid var(--color-border)",
								}}
							>
								<FileGlyph name={file.name} size={32} />
								<div className="min-w-0 flex-1">
									<div className="truncate text-[13px] text-fg-1">
										{file.name}
									</div>
									<div className="mt-0.5 text-[11px] text-fg-3">
										{formatBytes(file.size)}
									</div>
								</div>
								<Button
									type="button"
									size="icon-sm"
									onClick={() => handleDownloadOne(file.id)}
									disabled={fetchingFileId === file.id || isFetchingAll}
									className="shrink-0 rounded-lg bg-surface-3 text-fg-2 hover:bg-surface-4 hover:text-fg-1"
									aria-label={`Download ${file.name}`}
								>
									<HI icon={Download01Icon} size={14} />
								</Button>
							</div>
						))}
					</div>

					{transfer.message && (
						<p className="mt-4 whitespace-pre-wrap text-[13px] leading-[1.5] text-fg-2">
							{transfer.message}
						</p>
					)}

					{error && <p className="mt-4 text-xs text-destructive">{error}</p>}

					<Button
						type="button"
						size="xl"
						onClick={handleDownloadAll}
						disabled={isFetchingAll}
						className="mt-[18px] w-full"
					>
						{isFetchingAll ? (
							"Preparing..."
						) : downloadedAll ? (
							<>
								<HI icon={Tick02Icon} size={16} strokeWidth={2} />
								Downloaded
							</>
						) : (
							<>
								<HI icon={Download01Icon} size={16} />
								Download all ({formatBytes(totalBytes)})
							</>
						)}
					</Button>
				</div>
			</main>
		</div>
	);
}

function DownloadErrorPage({ error }: { error: unknown }) {
	const message =
		error instanceof Error
			? error.message
			: "This transfer does not exist or has expired.";

	return (
		<div className="relative min-h-screen">
			<TopBar />
			<main className="flex min-h-[calc(100vh-90px)] items-center justify-center px-5 py-10">
				<div className="ht-fade-in w-full max-w-[440px] rounded-3xl bg-surface-1 p-8 text-center">
					<div className="font-serif-italic text-[28px] leading-[1.15] tracking-[-0.02em] text-fg-0">
						Transfer not found
					</div>
					<p className="mt-3 text-[13px] leading-[1.5] text-fg-3">{message}</p>
				</div>
			</main>
		</div>
	);
}
