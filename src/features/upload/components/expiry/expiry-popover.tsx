import { Clock01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { HI } from "#/components/ui/hi";

export type ExpiryDays = 1 | 3 | 7;

type Option = {
	id: ExpiryDays;
	label: string;
	sub: string;
};

export const EXPIRY_OPTIONS = [
	{ id: 1, label: "1 day", sub: "Expires tomorrow" },
	{ id: 3, label: "3 days", sub: "Short turnaround" },
	{ id: 7, label: "7 days", sub: "Most common" },
] as const satisfies readonly Option[];

type ExpiryPopoverProps = {
	value: ExpiryDays;
	onChange: (value: ExpiryDays) => void;
};

export function ExpiryPopover({ value, onChange }: ExpiryPopoverProps) {
	const current = EXPIRY_OPTIONS.find((option) => option.id === value);
	const label = current?.label ?? `${value} days`;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="secondary"
						size="sm"
						aria-label="Link expiry"
						className="rounded-full"
					/>
				}
			>
				<HI icon={Clock01Icon} size={14} />
				<span className="text-xs font-medium">{label}</span>
			</DropdownMenuTrigger>
			<DropdownMenuContent side="top" align="end" sideOffset={8}>
				<div className="px-3 py-2 text-xs text-muted-foreground">
					Link expires in
				</div>
				{EXPIRY_OPTIONS.map((option) => {
					const selected = option.id === value;
					return (
						<DropdownMenuItem
							key={option.id}
							onClick={() => onChange(option.id)}
						>
							<div className="flex-1 text-sm font-medium">{option.label}</div>
							{selected && <HI icon={Tick02Icon} size={16} strokeWidth={2} />}
						</DropdownMenuItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
