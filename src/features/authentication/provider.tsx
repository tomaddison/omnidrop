import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { browserClient } from "../../../supabase/utils/client";

export type AuthUser = {
	id: string;
	email: string;
};

type AuthContextValue = {
	user: AuthUser | null;
	loading: boolean;
	refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
	user: null,
	loading: true,
	refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
	const supabase = useMemo(() => browserClient(), []);
	const [user, setUser] = useState<AuthUser | null>(null);
	const [loading, setLoading] = useState(true);

	const loadClaims = useCallback(async () => {
		const { data } = await supabase.auth.getClaims();
		const claims = data?.claims;
		setUser(
			claims?.sub && claims.email
				? { id: claims.sub, email: claims.email }
				: null,
		);
	}, [supabase.auth]);

	useEffect(() => {
		let cancelled = false;
		loadClaims().then(() => {
			if (!cancelled) setLoading(false);
		});
		// onAuthStateChange is a cheap trigger; we still verify via getClaims.
		const { data } = supabase.auth.onAuthStateChange(() => {
			loadClaims();
		});
		return () => {
			cancelled = true;
			data.subscription.unsubscribe();
		};
	}, [supabase.auth, loadClaims]);

	return (
		<AuthContext.Provider value={{ user, loading, refresh: loadClaims }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(AuthContext);
}
