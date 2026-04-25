import { Button } from "#/components/ui/button";
import { useSignOut } from "#/features/authentication/hooks/use-sign-out";
import { useAuth } from "#/features/authentication/provider";

export function TopBar() {
	const { user } = useAuth();
	const { signOut, isPending } = useSignOut();

	return (
		<header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-6">
			<a
				href="/"
				className="flex p-2 items-center gap-1 text-fg-1 no-underline"
			>
				<img
					src="/logo.svg"
					alt="Omnidrop"
					className="block h-[18px] w-auto brightness-0 invert"
				/>
			</a>
			{user && (
				<div className="flex items-center gap-3 text-fg-1">
					<span
						className="max-w-[180px] truncate text-sm text-fg-2"
						title={user.email}
					>
						{user.email}
					</span>
					<Button
						variant="secondary"
						size="sm"
						onClick={signOut}
						disabled={isPending}
					>
						Sign out
					</Button>
				</div>
			)}
		</header>
	);
}
