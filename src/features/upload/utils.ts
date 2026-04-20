import type { UploadEntry } from "./types";

// 2 GB matches the S3 presigned-POST content-length-range ceiling we enforce
// server-side. Raising this also means raising the ranges on the free tier.
export const MAX_TOTAL_BYTES = 2 * 1024 ** 3;
export const MAX_PATH_LENGTH = 1024;
export const MAX_SEGMENT_LENGTH = 255;
export const MAX_DEPTH = 32;

// OS-generated bookkeeping files that appear silently when users drop folders.
// Uploading them wastes quota and clutters the download manifest.
const SKIP_BASENAMES: ReadonlySet<string> = new Set([
	".DS_Store",
	"Thumbs.db",
	"desktop.ini",
]);

export function shouldSkipBasename(name: string): boolean {
	return SKIP_BASENAMES.has(name);
}

export type ValidationResult = { ok: true } | { ok: false; reason: string };

export function validateRelativePath(raw: string): ValidationResult {
	const p = raw.trim();
	if (p.length === 0) return { ok: false, reason: "Path is empty." };
	if (p.length > MAX_PATH_LENGTH)
		return { ok: false, reason: "Path is too long." };
	if (p.includes("\\"))
		return { ok: false, reason: "Path contains a backslash." };
	if (p.startsWith("/")) return { ok: false, reason: "Path is absolute." };
	if (/^[A-Za-z]:/.test(p))
		return { ok: false, reason: "Path has a drive prefix." };

	for (let i = 0; i < p.length; i++) {
		const code = p.charCodeAt(i);
		if (code < 0x20)
			return { ok: false, reason: "Path contains a control character." };
	}

	const segments = p.split("/");
	if (segments.length > MAX_DEPTH)
		return { ok: false, reason: "Path is too deep." };

	for (const seg of segments) {
		if (seg === "" || seg === "." || seg === "..") {
			return { ok: false, reason: "Path has an invalid segment." };
		}
		if (seg.length > MAX_SEGMENT_LENGTH) {
			return { ok: false, reason: "Path segment is too long." };
		}
	}

	return { ok: true };
}

// --- Browser-only helpers (depend on DOM APIs) ---

export function filesFromInput(files: FileList): UploadEntry[] {
	const entries: UploadEntry[] = [];
	for (const file of Array.from(files)) {
		const relativePath =
			(file as File & { webkitRelativePath?: string }).webkitRelativePath ||
			file.name;
		if (shouldSkipBasename(basename(relativePath))) continue;
		entries.push({ file, relativePath });
	}
	return entries;
}

export async function walkDataTransferItems(
	items: DataTransferItemList,
): Promise<UploadEntry[]> {
	// DataTransferItemList is invalidated after the drop handler returns,
	// so we must call webkitGetAsEntry() synchronously up-front on every item
	// before awaiting anything.
	const rootEntries: FileSystemEntry[] = [];
	for (const item of Array.from(items)) {
		if (item.kind !== "file") continue;
		const entry = item.webkitGetAsEntry();
		if (entry) rootEntries.push(entry);
	}

	const results = await Promise.all(rootEntries.map((e) => walkEntry(e, "")));
	return results.flat();
}

async function walkEntry(
	entry: FileSystemEntry,
	parentPath: string,
): Promise<UploadEntry[]> {
	if (shouldSkipBasename(entry.name)) return [];
	const relativePath = parentPath ? `${parentPath}/${entry.name}` : entry.name;

	if (entry.isFile) {
		const file = await readFile(entry as FileSystemFileEntry);
		return [{ file, relativePath }];
	}

	if (entry.isDirectory) {
		const children = await readAllChildren(entry as FileSystemDirectoryEntry);
		const nested = await Promise.all(
			children.map((c) => walkEntry(c, relativePath)),
		);
		return nested.flat();
	}

	return [];
}

function readFile(entry: FileSystemFileEntry): Promise<File> {
	return new Promise((resolve, reject) => {
		entry.file(resolve, reject);
	});
}

async function readAllChildren(
	entry: FileSystemDirectoryEntry,
): Promise<FileSystemEntry[]> {
	// readEntries returns children in batches (~100 per call in Chrome)
	// and must be drained in a loop until it returns an empty array.
	const reader = entry.createReader();
	const all: FileSystemEntry[] = [];
	while (true) {
		const batch = await new Promise<FileSystemEntry[]>((resolve) => {
			reader.readEntries(resolve, () => resolve([]));
		});
		if (batch.length === 0) break;
		all.push(...batch);
	}
	return all;
}

function basename(path: string): string {
	const i = path.lastIndexOf("/");
	return i === -1 ? path : path.slice(i + 1);
}
