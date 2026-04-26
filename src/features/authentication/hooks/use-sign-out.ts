import { useRouter } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { browserClient } from "~/supabase/utils/client";

export function useSignOut() {
	const router = useRouter();
	const [isPending, setIsPending] = useState(false);

	const signOut = useCallback(async () => {
		setIsPending(true);
		const supabase = browserClient();
		try {
			await supabase.auth.signOut({ scope: "local" });
			supabase.auth.signOut({ scope: "global" }).catch(() => {});
			router.invalidate();
		} finally {
			setIsPending(false);
		}
	}, [router]);

	return { signOut, isPending };
}
