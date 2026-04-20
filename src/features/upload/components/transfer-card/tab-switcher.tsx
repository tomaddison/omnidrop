import { Tabs } from "@base-ui/react/tabs";

export type Mode = "link" | "email";

type TabSwitcherProps = {
	mode: Mode;
	onChange: (mode: Mode) => void;
	disabled?: boolean;
};

const TABS = [
	{ id: "link", label: "Link" },
	{ id: "email", label: "Email" },
] as const satisfies readonly { id: Mode; label: string }[];

function isMode(value: string): value is Mode {
	return value === "link" || value === "email";
}

export function TabSwitcher({ mode, onChange, disabled }: TabSwitcherProps) {
	return (
		<Tabs.Root
			value={mode}
			onValueChange={(next) => {
				if (isMode(next)) onChange(next);
			}}
			className="h-9 flex-1 rounded-xl bg-secondary p-[3px]"
		>
			<Tabs.List className="relative flex h-full w-full">
				<Tabs.Indicator className="absolute top-0 left-0 h-full w-(--active-tab-width) rounded-[0.7rem] bg-accent transform-[translateX(var(--active-tab-left))] transition-[transform,width] ease-[cubic-bezier(0.32,0.72,0,1)]" />
				{TABS.map((tab) => (
					<Tabs.Tab
						key={tab.id}
						value={tab.id}
						disabled={disabled}
						className="relative z-10 flex flex-1 items-center justify-center rounded-[0.7rem] px-3 text-xs font-medium text-muted-foreground outline-none transition-colors select-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 data-active:text-foreground"
					>
						{tab.label}
					</Tabs.Tab>
				))}
			</Tabs.List>
		</Tabs.Root>
	);
}
