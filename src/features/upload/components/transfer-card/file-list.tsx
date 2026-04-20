import {
	Cancel01Icon,
	Folder01Icon,
	PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "#/components/ui/button";
import { FileGlyph } from "#/components/ui/file-glyph";
import { HI } from "#/components/ui/hi";
import type { UploadEntry } from "#/features/upload/types";
import { formatBytes } from "#/lib/format";

type FileListProps = {
	entries: UploadEntry[];
	onRemove: (relativePath: string) => void;
	onRemoveFolder: (folder: string) => void;
	onAddFiles: () => void;
	onAddFolder: () => void;
	disabled?: boolean;
};

type Group =
	| { kind: "file"; entry: UploadEntry }
	| { kind: "folder"; folder: string; entries: UploadEntry[]; bytes: number };

function groupEntries(entries: UploadEntry[]): Group[] {
	const folderMap = new Map<string, UploadEntry[]>();
	const order: (string | { file: UploadEntry })[] = [];

	for (const entry of entries) {
		const slash = entry.relativePath.indexOf("/");
		if (slash === -1) {
			order.push({ file: entry });
		} else {
			const folder = entry.relativePath.slice(0, slash);
			if (!folderMap.has(folder)) {
				folderMap.set(folder, []);
				order.push(folder);
			}
			folderMap.get(folder)?.push(entry);
		}
	}

	return order.map((item) => {
		if (typeof item === "string") {
			const folderEntries = folderMap.get(item) ?? [];
			const bytes = folderEntries.reduce((sum, e) => sum + e.file.size, 0);
			return { kind: "folder", folder: item, entries: folderEntries, bytes };
		}
		return { kind: "file", entry: item.file };
	});
}

export function FileList({
	entries,
	onRemove,
	onRemoveFolder,
	onAddFiles,
	onAddFolder,
	disabled,
}: FileListProps) {
	const groups = groupEntries(entries);

	return (
		<div className="flex flex-col overflow-hidden rounded-2xl max-h-[200px] bg-muted">
			<div className="min-h-0 overflow-y-auto">
				{groups.map((group, i) => {
					const key =
						group.kind === "folder"
							? `dir:${group.folder}`
							: group.entry.relativePath;
					const onRemoveClick =
						group.kind === "folder"
							? () => onRemoveFolder(group.folder)
							: () => onRemove(group.entry.relativePath);
					const ariaLabel =
						group.kind === "folder"
							? `Remove ${group.folder}`
							: `Remove ${group.entry.relativePath}`;

					return (
						<div
							key={key}
							data-first={i === 0}
							className="ht-fade-in-fast flex items-center gap-2.5 border-t border-border px-3 py-2.5 data-[first=true]:border-t-0"
						>
							{group.kind === "folder" ? (
								<div className="flex size-[30px] shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground">
									<HI icon={Folder01Icon} size={16} />
								</div>
							) : (
								<FileGlyph name={group.entry.file.name} size={30} />
							)}
							<div className="min-w-0 flex-1">
								<div className="truncate text-sm text-foreground">
									{group.kind === "folder"
										? group.folder
										: group.entry.relativePath}
								</div>
								<div className="mt-0.5 text-xs text-muted-foreground">
									{group.kind === "folder"
										? `${group.entries.length} ${group.entries.length === 1 ? "file" : "files"} · ${formatBytes(group.bytes)}`
										: formatBytes(group.entry.file.size)}
								</div>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								className={"rounded-sm size-6"}
								onClick={onRemoveClick}
								disabled={disabled}
								aria-label={ariaLabel}
							>
								<HI icon={Cancel01Icon} size={14} />
							</Button>
						</div>
					);
				})}
			</div>
			<div className="flex border-t-2 border-card gap-0.5 bg-card">
				<Button
					type="button"
					variant="secondary"
					size="sm"
					onClick={onAddFiles}
					disabled={disabled}
					className="flex-1 rounded-none"
				>
					<HI icon={PlusSignIcon} size={14} /> Add files
				</Button>
				<Button
					type="button"
					variant="secondary"
					size="sm"
					onClick={onAddFolder}
					disabled={disabled}
					className="flex-1 rounded-none border-l border"
				>
					<HI icon={Folder01Icon} size={14} /> Add folder
				</Button>
			</div>
		</div>
	);
}
