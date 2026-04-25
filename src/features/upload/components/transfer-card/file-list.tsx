import {
	Cancel01Icon,
	Folder01Icon,
	PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "#/components/ui/button";
import { FileGlyph } from "#/components/ui/file-glyph";
import { HI } from "#/components/ui/hi";
import type { UploadEntry } from "#/features/upload/types";
import { groupByTopFolder } from "#/lib/file-groups";
import { formatBytes, pluralizeFiles } from "#/lib/format";

type FileListProps = {
	entries: UploadEntry[];
	onRemove: (relativePath: string) => void;
	onRemoveFolder: (folder: string) => void;
	onAddFiles: () => void;
	onAddFolder: () => void;
	disabled?: boolean;
};

export function FileList({
	entries,
	onRemove,
	onRemoveFolder,
	onAddFiles,
	onAddFolder,
	disabled,
}: FileListProps) {
	const groups = groupByTopFolder(
		entries,
		(e) => e.relativePath,
		(e) => e.file.size,
	);

	return (
		<div className="flex flex-col rounded-md bg-muted">
			<div>
				{groups.map((group, i) => {
					const key =
						group.kind === "folder"
							? `dir:${group.folder}`
							: group.item.relativePath;
					const onRemoveClick =
						group.kind === "folder"
							? () => onRemoveFolder(group.folder)
							: () => onRemove(group.item.relativePath);
					const ariaLabel =
						group.kind === "folder"
							? `Remove ${group.folder}`
							: `Remove ${group.item.relativePath}`;

					return (
						<div
							key={key}
							data-first={i === 0}
							className="om-fade-in-fast flex items-center gap-2.5 border-t border-border px-3 py-2.5 data-[first=true]:border-t-0"
						>
							{group.kind === "folder" ? (
								<div className="flex size-[30px] shrink-0 items-center justify-center rounded-md bg-accent/60 text-muted-foreground">
									<HI
										icon={Folder01Icon}
										className="fill-muted-foreground"
										size={16}
									/>
								</div>
							) : (
								<FileGlyph name={group.item.file.name} size={30} />
							)}
							<div className="min-w-0 flex-1">
								<div className="truncate text-sm text-foreground">
									{group.kind === "folder"
										? group.folder
										: group.item.relativePath}
								</div>
								<div className="mt-0.5 text-xs text-muted-foreground">
									{group.kind === "folder"
										? `${group.count} ${pluralizeFiles(group.count)} · ${formatBytes(group.bytes)}`
										: formatBytes(group.item.file.size)}
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
			<div className="flex border-t-2 border-card rounded-b-xl overflow-hidden gap-0.5 bg-card">
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
					<HI
						icon={Folder01Icon}
						size={14}
						className="fill-secondary-foreground"
					/>{" "}
					Add folders
				</Button>
			</div>
		</div>
	);
}
