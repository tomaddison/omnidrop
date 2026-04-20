import { type ReactNode, useCallback, useRef } from "react";
import type { UploadEntry } from "#/features/upload/types";
import { filesFromInput } from "#/features/upload/utils";

type UseFilePickers = {
	inputs: ReactNode;
	openFiles: () => void;
	openFolder: () => void;
};

type UseFilePickersOptions = {
	onPick: (entries: UploadEntry[]) => void;
};

export function useFilePickers({
	onPick,
}: UseFilePickersOptions): UseFilePickers {
	const filesRef = useRef<HTMLInputElement>(null);
	const folderRef = useRef<HTMLInputElement>(null);

	const handleChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const picked = event.target.files;
			if (picked && picked.length > 0) {
				onPick(filesFromInput(picked));
			}
			event.target.value = "";
		},
		[onPick],
	);

	const openFiles = useCallback(() => filesRef.current?.click(), []);
	const openFolder = useCallback(() => folderRef.current?.click(), []);

	const inputs = (
		<>
			<input
				ref={filesRef}
				type="file"
				multiple
				onChange={handleChange}
				className="hidden"
			/>
			<input
				ref={folderRef}
				type="file"
				multiple
				// @ts-expect-error webkitdirectory + directory are non-standard but supported by Chromium/WebKit/Firefox
				webkitdirectory=""
				directory=""
				onChange={handleChange}
				className="hidden"
			/>
		</>
	);

	return { inputs, openFiles, openFolder };
}
