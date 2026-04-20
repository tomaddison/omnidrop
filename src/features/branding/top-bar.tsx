export function TopBar() {
	return (
		<header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-9">
			<div className="flex items-center gap-2 text-fg-1 no-underline">
				<img
					src="/logo.svg"
					alt="Omnidrop"
					className="block h-[18px] w-auto"
				/>
				<span className="select-none text-[15px] font-semibold tracking-tight">
					Omnidrop
				</span>
			</div>
		</header>
	);
}
