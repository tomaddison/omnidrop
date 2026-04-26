import {
	type FileKind,
	fileExtensionLabel,
	fileKindLabel,
	inferFileKind,
} from "@/lib/format";
import { cn } from "@/lib/utils";

const KIND_STYLES: Record<FileKind, { bg: string; fg: string }> = {
	audio: { bg: "rgba(134, 239, 172, 0.14)", fg: "#86efac" },
	image: { bg: "rgba(196, 181, 253, 0.14)", fg: "#c4b5fd" },
	video: { bg: "rgba(252, 165, 165, 0.14)", fg: "#fca5a5" },
	doc: { bg: "rgba(253, 186, 116, 0.14)", fg: "#fdba74" },
	zip: { bg: "rgba(165, 243, 252, 0.14)", fg: "#a5f3fc" },
	generic: { bg: "rgba(161, 161, 170, 0.12)", fg: "#a1a1aa" },
};

type FileGlyphProps = {
	name?: string;
	kind?: FileKind;
	size?: number;
	className?: string;
};

export function FileGlyph({
	name,
	kind,
	size = 30,
	className,
}: FileGlyphProps) {
	const resolved: FileKind = kind ?? (name ? inferFileKind(name) : "generic");
	const label = name ? fileExtensionLabel(name) : fileKindLabel(resolved);
	const styles = KIND_STYLES[resolved];
	return (
		<div
			className={cn(
				"flex shrink-0 items-center justify-center rounded-md font-mono text-[9px] font-semibold tracking-[0.05em]",
				className,
			)}
			style={{
				width: size,
				height: size,
				background: styles.bg,
				color: styles.fg,
			}}
		>
			{label}
		</div>
	);
}
