import { TopBar } from "./top-bar";

type LegalPageProps = {
	title: string;
	effectiveDate: string;
	children: React.ReactNode;
};

export function LegalPage({ title, effectiveDate, children }: LegalPageProps) {
	return (
		<div className="relative min-h-[calc(100vh-150px)]">
			<TopBar />
			<main className="mx-auto w-full max-w-[760px] px-6 py-12 md:py-16">
				<header className="mb-10">
					<h1 className="m-0 text-3xl font-semibold tracking-[-0.01em] text-fg-0 md:text-4xl">
						{title}
					</h1>
					<p className="mt-2 text-sm text-fg-3">
						Effective as of {effectiveDate}
					</p>
				</header>
				<div className="space-y-6 text-[15px] leading-7 text-fg-2 [&_a]:text-fg-1 [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-fg-0 [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-fg-0 [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-fg-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:text-fg-2 [&_strong]:text-fg-1 [&_strong]:font-semibold">
					{children}
				</div>
			</main>
		</div>
	);
}
