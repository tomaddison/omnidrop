import { HeroCopy } from "./hero";

type StageProps = {
	children: React.ReactNode;
};

export function Stage({ children }: StageProps) {
	return (
		<main className="relative z-1 flex min-h-[calc(100vh-150px)] items-center justify-start px-6 py-10 md:px-16">
			<div className="relative z-2 mx-auto flex w-full max-w-[1200px] flex-col items-center gap-10 md:flex-row">
				{children}
				<HeroCopy />
			</div>
		</main>
	);
}
