import type { Layout } from "./hero";

type FullBleedBackdropProps = {
	layout: Layout;
};

export function FullBleedBackdrop({ layout }: FullBleedBackdropProps) {
	if (layout !== "fullbleed") return null;
	return (
		<div
			className="pointer-events-none absolute inset-0 z-0 flex select-none items-center justify-center overflow-hidden"
			aria-hidden="true"
		>
			<div
				className="font-serif-italic"
				style={{
					fontSize: "min(22vw, 340px)",
					lineHeight: 1,
					color: "transparent",
					WebkitTextStroke: "1px rgba(255,255,255,0.04)",
					letterSpacing: "-0.04em",
					whiteSpace: "nowrap",
				}}
			>
				transfer
			</div>
		</div>
	);
}
