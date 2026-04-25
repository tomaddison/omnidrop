import { Clock01Icon, Folder01Icon } from "@hugeicons/core-free-icons";
import { createFileRoute } from "@tanstack/react-router";
import JSZip from "jszip";
import { useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { FileGlyph } from "#/components/ui/file-glyph";
import { HI } from "#/components/ui/hi";
import { TopBar } from "#/features/branding/top-bar";
import { getTransferFn } from "#/features/download/server/get-transfer";
import { issueDownloadUrlsFn } from "#/features/download/server/issue-download-urls";
import { groupByTopFolder } from "#/lib/file-groups";
import {
	formatBytes,
	formatExpiryRelative,
	pluralizeFiles,
} from "#/lib/format";

function pluralizeItems(count: number, word: "item" | "folder"): string {
	return count === 1 ? word : `${word}s`;
}

export const Route = createFileRoute("/d/$slug")({
	loader: ({ params }) => getTransferFn({ data: { slug: params.slug } }),
	component: DownloadPage,
	errorComponent: DownloadErrorPage,
	head: ({ loaderData }) => ({
		meta: [
			{
				title: loaderData?.title
					? `${loaderData.title} | Omnidrop`
					: "Download | Omnidrop",
			},
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});

function toZipName(title: string | null, slug: string): string {
	const cleaned = (title ?? "")
		// biome-ignore lint/suspicious/noControlCharactersInRegex: stripping control chars from user-provided title
		.replace(/[\\/:*?"<>|\x00-\x1f]/g, "")
		.replace(/\s+/g, " ")
		.trim()
		.slice(0, 100);
	return cleaned || `omnidrop-transfer-${slug}`;
}

function DownloadPage() {
	const transfer = Route.useLoaderData();
	const [isPreparing, setIsPreparing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const totalBytes = transfer.files.reduce((sum, f) => sum + f.size, 0);
	const groups = groupByTopFolder(
		transfer.files,
		(f) => f.name,
		(f) => f.size,
	);
	const folderCount = groups.filter((g) => g.kind === "folder").length;
	const fileCount = groups.length - folderCount;
	const itemCount = groups.length;
	const itemLabel =
		folderCount > 0 && fileCount === 0
			? pluralizeItems(itemCount, "folder")
			: folderCount === 0
				? pluralizeFiles(itemCount)
				: pluralizeItems(itemCount, "item");

	async function handleDownload() {
		setError(null);
		setIsPreparing(true);
		try {
			const { urls } = await issueDownloadUrlsFn({
				data: { slug: transfer.slug },
			});

			if (urls.length === 1) {
				const { url, name } = urls[0];
				const response = await fetch(url);
				if (!response.ok) throw new Error(`Failed to fetch ${name}`);
				const blob = await response.blob();
				const filename = name.split("/").pop() ?? name;
				const blobUrl = URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.href = blobUrl;
				link.download = filename;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				URL.revokeObjectURL(blobUrl);
			} else {
				const files = await Promise.all(
					urls.map(async ({ url, name }) => {
						const response = await fetch(url);
						if (!response.ok) throw new Error(`Failed to fetch ${name}`);
						return { name, buffer: await response.arrayBuffer() };
					}),
				);

				const zip = new JSZip();
				for (const { name, buffer } of files) zip.file(name, buffer);
				const blob = await zip.generateAsync({ type: "blob" });

				const blobUrl = URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.href = blobUrl;
				link.download = `${toZipName(transfer.title, transfer.slug)}.zip`;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				URL.revokeObjectURL(blobUrl);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Download failed.");
		} finally {
			setIsPreparing(false);
		}
	}

	return (
		<div>
			<TopBar />
			<main className="flex min-h-[calc(100vh-150px)] items-center justify-center px-5 py-10">
				<div className="om-fade-in space-y-4 w-full max-w-[520px] rounded-xl bg-surface-1 p-6">
					<div>
						{transfer.title && (
							<div className="truncate text-xl font-semibold text-fg-0">
								{transfer.title}
							</div>
						)}
						<div className="truncate leading-6 text-xs text-fg-3">
							From {transfer.senderEmail ?? "Omnidrop"}
						</div>
					</div>

					<Badge
						variant="secondary"
						className="grid grid-flow-col grid-cols-3 justify-items-center h-fit text-sm w-full p-2 text-primary"
					>
						<span>
							{itemCount} {itemLabel}
						</span>
						<span>{formatBytes(totalBytes)}</span>
						{transfer.expiresAt && (
							<span className="inline-flex items-center gap-1.5">
								<HI icon={Clock01Icon} size={14} />
								{formatExpiryRelative(transfer.expiresAt)}
							</span>
						)}
					</Badge>

					{transfer.message && (
						<div className="rounded-2xl bg-surface-2 p-4">
							<p className="whitespace-pre-wrap text-sm leading-normal">
								{transfer.message}
							</p>
						</div>
					)}

					<div className="rounded-md bg-surface-2 overflow-hidden">
						<div className="max-h-[260px] overflow-y-auto overflow-x-hidden divide-y divide-border">
							{groups.map((group) => {
								const key =
									group.kind === "folder"
										? `dir:${group.folder}`
										: group.item.id;
								return (
									<div
										key={key}
										className="flex items-center gap-3 px-3.5 py-3"
									>
										{group.kind === "folder" ? (
											<div className="flex size-[32px] shrink-0 items-center justify-center rounded-md bg-surface-1 text-fg-3">
												<HI
													icon={Folder01Icon}
													className="fill-fg-3"
													size={16}
												/>
											</div>
										) : (
											<FileGlyph name={group.item.name} size={32} />
										)}
										<div className="min-w-0 flex-1">
											<div className="truncate text-[13px] text-fg-1">
												{group.kind === "folder"
													? group.folder
													: group.item.name}
											</div>
											<div className="mt-0.5 text-[11px] text-fg-3">
												{group.kind === "folder"
													? `${group.count} ${pluralizeFiles(group.count)} · ${formatBytes(group.bytes)}`
													: formatBytes(group.item.size)}
											</div>
										</div>
									</div>
								);
							})}
						</div>
						{error && (
							<p className="border-t border-border px-3.5 py-2 text-xs text-destructive">
								{error}
							</p>
						)}
						<div className="border-t border-border px-3.5 py-3">
							<Button
								type="button"
								size="xl"
								onClick={handleDownload}
								isLoading={isPreparing}
								className="w-full"
							>
								{`Download (${formatBytes(totalBytes)})`}
							</Button>
						</div>
					</div>
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
		<div>
			<TopBar />
			<main className="flex min-h-[calc(100vh-150px)] items-center justify-center px-5 py-10">
				<div className="om-fade-in w-full max-w-[440px] rounded-3xl bg-surface-1 p-8 text-center">
					<div className="text-xl leading-[1.15] font-semibold tracking-[-0.02em] text-fg-0">
						Transfer not found
					</div>
					<p className="mt-3 text-[13px] leading-normal text-fg-3">{message}</p>
				</div>
			</main>
		</div>
	);
}
