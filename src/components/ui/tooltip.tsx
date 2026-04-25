import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { cn } from "#/lib/utils";

function TooltipProvider({
	delay = 150,
	closeDelay = 0,
	...props
}: TooltipPrimitive.Provider.Props) {
	return (
		<TooltipPrimitive.Provider
			delay={delay}
			closeDelay={closeDelay}
			{...props}
		/>
	);
}

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
	return <TooltipPrimitive.Root {...props} />;
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
	return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
	side = "top",
	sideOffset = 6,
	align = "center",
	className,
	...props
}: TooltipPrimitive.Popup.Props &
	Pick<TooltipPrimitive.Positioner.Props, "align" | "side" | "sideOffset">) {
	return (
		<TooltipPrimitive.Portal>
			<TooltipPrimitive.Positioner
				className="isolate z-50 outline-none"
				side={side}
				sideOffset={sideOffset}
				align={align}
			>
				<TooltipPrimitive.Popup
					data-slot="tooltip-content"
					className={cn(
						"z-50 max-w-60 origin-(--transform-origin) rounded-lg bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-md ring-1 ring-foreground/5 duration-100 outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
						className,
					)}
					{...props}
				/>
			</TooltipPrimitive.Positioner>
		</TooltipPrimitive.Portal>
	);
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
