export type Layout = "centered" | "left" | "fullbleed";

type HeroCopyProps = {
	layout: Layout;
};

export function HeroCopy({ layout }: HeroCopyProps) {
	if (layout !== "left") return null;
	return (
		<div className="ht-fade-in max-w-[560px] flex-1 px-6 md:px-14">
			<div className="mb-4 text-[11px] font-medium uppercase tracking-[0.14em] text-fg-3">
				Omnidrop
			</div>
			<h1 className="m-0 font-serif text-[56px] font-normal leading-[1.02] tracking-[-0.02em] text-fg-0 md:text-[68px]">
				Send anything.
				<br />
				<span className="italic text-[var(--accent-raw)]">
					Keep the clarity.
				</span>
			</h1>
			<p className="mt-6 max-w-[440px] text-base leading-[1.55] text-fg-2">
				Lossless file transfers for creative teams. Up to 2&nbsp;GB per link,
				expires when you say.
			</p>
		</div>
	);
}
