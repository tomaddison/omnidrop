import { cn } from "#/lib/utils";
import { HeroCopy, type Layout } from "./hero";

type StageProps = {
	layout: Layout;
	children: React.ReactNode;
};

export function Stage({ layout, children }: StageProps) {
	return (
		<main
			className={cn(
				"relative z-[1] flex min-h-[calc(100vh-90px)]",
				layout === "centered" && "items-center justify-center px-5 py-10",
				layout === "left" && "items-center justify-start px-6 py-10 md:px-16",
				layout === "fullbleed" && "items-stretch justify-center",
			)}
			data-layout={layout}
		>
			<div
				className={cn(
					"relative z-[2] mx-auto flex items-center",
					layout === "left"
						? "w-full max-w-[1200px] flex-col gap-10 md:flex-row"
						: "flex-col gap-5",
				)}
			>
				{children}
				<HeroCopy layout={layout} />
			</div>
		</main>
	);
}
