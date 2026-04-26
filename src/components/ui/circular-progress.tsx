import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CircularProgressProps = {
	value: number;
	size?: number;
	strokeWidth?: number;
	className?: string;
	children?: ReactNode;
	indeterminate?: boolean;
};

export function CircularProgress({
	value,
	size = 112,
	strokeWidth = 8,
	className,
	children,
	indeterminate = false,
}: CircularProgressProps) {
	const clamped = Math.min(100, Math.max(0, value));
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const offset = indeterminate
		? circumference * 0.9
		: circumference * (1 - clamped / 100);
	const center = size / 2;

	return (
		<div
			className={cn("relative inline-flex", className)}
			style={{ width: size, height: size }}
		>
			<svg
				width={size}
				height={size}
				className={indeterminate ? "animate-spin" : "-rotate-90"}
				role="img"
				aria-label={indeterminate ? "Working" : `${Math.round(clamped)}%`}
			>
				<circle
					cx={center}
					cy={center}
					r={radius}
					fill="none"
					strokeWidth={strokeWidth}
					className="stroke-muted"
				/>
				<circle
					cx={center}
					cy={center}
					r={radius}
					fill="none"
					strokeWidth={strokeWidth}
					strokeLinecap="round"
					strokeDasharray={circumference}
					strokeDashoffset={offset}
					className={cn(
						"stroke-primary",
						!indeterminate &&
							"transition-[stroke-dashoffset] duration-200 ease-linear",
					)}
				/>
			</svg>
			<div className="absolute inset-0 flex items-center justify-center">
				{children}
			</div>
		</div>
	);
}
