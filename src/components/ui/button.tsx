import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "#/lib/utils";

const buttonVariants = cva(
	"inline-flex shrink-0 items-center active:scale-[98.5%] cursor-pointer justify-center gap-1.5 rounded-2xl border border-transparent text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground hover:bg-primary/90",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/80",
				outline:
					"border-border bg-background hover:bg-accent hover:text-accent-foreground",
				ghost: "hover:bg-accent hover:text-accent-foreground",
				destructive:
					"bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30",
				link: "text-primary hover:text-primary/80",
			},
			size: {
				default: "h-9 px-4",
				sm: "h-8 px-3 text-xs",
				lg: "h-10 px-4",
				xl: "h-[52px] px-5 text-md",
				xs: "h-6 px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
				icon: "size-9",
				"icon-sm": "size-8",
				"icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant = "default",
	size = "default",
	...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
	return (
		<ButtonPrimitive
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
