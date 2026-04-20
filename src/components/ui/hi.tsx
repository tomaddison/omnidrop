import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { cn } from "#/lib/utils";

type HIProps = {
	icon: IconSvgElement;
	size?: number;
	strokeWidth?: number;
	className?: string;
};

export function HI({ icon, size = 18, strokeWidth = 1.5, className }: HIProps) {
	return (
		<HugeiconsIcon
			icon={icon}
			size={size}
			strokeWidth={strokeWidth}
			className={cn("shrink-0", className)}
		/>
	);
}
