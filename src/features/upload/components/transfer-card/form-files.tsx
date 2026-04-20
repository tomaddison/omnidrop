import { Folder01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { Button } from "#/components/ui/button";
import { HI } from "#/components/ui/hi";
import type { UploadEntry } from "#/features/upload/types";
import { FileList } from "./file-list";
import { useTransferFormContext } from "./form-context";

type FormFilesProps = {
	entries: UploadEntry[];
	onAddFiles: () => void;
	onAddFolder: () => void;
	onRemoveEntry: (relativePath: string) => void;
	onRemoveFolder: (folder: string) => void;
};

export function FormFiles({
	entries,
	onAddFiles,
	onAddFolder,
	onRemoveEntry,
	onRemoveFolder,
}: FormFilesProps) {
	const { disabled } = useTransferFormContext();

	if (entries.length > 0) {
		return (
			<FileList
				entries={entries}
				onRemove={onRemoveEntry}
				onRemoveFolder={onRemoveFolder}
				onAddFiles={onAddFiles}
				onAddFolder={onAddFolder}
				disabled={disabled}
			/>
		);
	}

	return (
		<div className="grid grid-cols-2 gap-1.5">
			<Button
				type="button"
				variant="secondary"
				onClick={onAddFiles}
				disabled={disabled}
				className="h-20 flex-col gap-1.5 px-3"
			>
				<div className="flex size-6 items-center justify-center rounded-full bg-accent">
					<HI icon={PlusSignIcon} size={14} strokeWidth={2.5} />
				</div>
				<span className="text-xs font-medium">Add files</span>
			</Button>
			<Button
				type="button"
				variant="secondary"
				onClick={onAddFolder}
				disabled={disabled}
				className="h-20 flex-col gap-1.5 px-3"
			>
				<div className="flex size-6 items-center justify-center">
					<HI
						icon={Folder01Icon}
						size={16}
						strokeWidth={1.5}
						className="[&_path]:fill-current"
					/>
				</div>
				<span className="text-xs font-medium">Add folder</span>
			</Button>
		</div>
	);
}
