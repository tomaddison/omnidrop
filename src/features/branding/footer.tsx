import { Link } from "@tanstack/react-router";

export function Footer() {
	return (
		<footer className="relative z-10 mt-auto flex justify-end gap-3 px-6 py-4 text-xs text-fg-3">
			<Link
				to="/privacy"
				className="underline-offset-4 hover:text-fg-1 hover:underline"
			>
				Privacy
			</Link>
			<span aria-hidden="true">·</span>
			<Link
				to="/terms"
				className="underline-offset-4 hover:text-fg-1 hover:underline"
			>
				Terms
			</Link>
		</footer>
	);
}
