export function formatBytes(bytes: number): string {
	if (!bytes) return "0 B";
	const units = ["B", "KB", "MB", "GB"];
	let value = bytes;
	let i = 0;
	while (value >= 1024 && i < units.length - 1) {
		value /= 1024;
		i++;
	}
	const precision = value < 10 && i > 0 ? 1 : 0;
	return `${value.toFixed(precision)} ${units[i]}`;
}

export type FileKind = "audio" | "image" | "video" | "doc" | "zip" | "generic";

const EXT_MAP: Record<string, FileKind> = {
	wav: "audio",
	mp3: "audio",
	flac: "audio",
	aiff: "audio",
	aif: "audio",
	ogg: "audio",
	m4a: "audio",
	jpg: "image",
	jpeg: "image",
	png: "image",
	gif: "image",
	webp: "image",
	svg: "image",
	mp4: "video",
	mov: "video",
	webm: "video",
	mkv: "video",
	pdf: "doc",
	doc: "doc",
	docx: "doc",
	txt: "doc",
	md: "doc",
	zip: "zip",
	rar: "zip",
	"7z": "zip",
	tar: "zip",
	gz: "zip",
};

export function inferFileKind(name: string): FileKind {
	const ext = name.toLowerCase().split(".").pop() ?? "";
	return EXT_MAP[ext] ?? "generic";
}

const KIND_FALLBACK: Record<FileKind, string> = {
	audio: "WAV",
	image: "JPG",
	video: "MP4",
	doc: "DOC",
	zip: "ZIP",
	generic: "FILE",
};

export function fileKindLabel(kind: FileKind): string {
	return KIND_FALLBACK[kind];
}

export function fileExtensionLabel(name: string): string {
	const dot = name.lastIndexOf(".");
	if (dot <= 0 || dot === name.length - 1) {
		return KIND_FALLBACK[inferFileKind(name)];
	}
	const ext = name.slice(dot + 1);
	return ext.length > 4 ? ext.slice(0, 4).toUpperCase() : ext.toUpperCase();
}
