// XMLHttpRequest (not fetch) because only XHR exposes upload progress events.
export function uploadToS3(
	url: string,
	fields: Record<string, string>,
	file: File,
	onProgress: (loaded: number) => void,
	signal: AbortSignal,
): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal.aborted) {
			reject(new DOMException("Upload aborted.", "AbortError"));
			return;
		}

		const xhr = new XMLHttpRequest();

		xhr.upload.addEventListener("progress", (e) => {
			if (e.lengthComputable) onProgress(e.loaded);
		});

		xhr.addEventListener("load", () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve();
			} else {
				reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
			}
		});

		xhr.addEventListener("error", () => {
			reject(new Error("Upload failed due to a network error."));
		});

		signal.addEventListener("abort", () => {
			xhr.abort();
			reject(new DOMException("Upload aborted.", "AbortError"));
		});

		// Presigned-POST requires the exact fields the policy was signed with,
		// in the same order, followed by the file as the final form part.
		const form = new FormData();
		for (const [name, value] of Object.entries(fields)) {
			form.append(name, value);
		}
		form.append("file", file);

		xhr.open("POST", url);
		xhr.send(form);
	});
}
