import { useEffect } from "react";

export function useBlockUnload(active: boolean) {
	useEffect(() => {
		if (!active) return;
		const onUnload = (event: BeforeUnloadEvent) => event.preventDefault();
		window.addEventListener("beforeunload", onUnload);
		return () => window.removeEventListener("beforeunload", onUnload);
	}, [active]);
}
