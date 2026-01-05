"use client";

import { createContext, useContext, ReactNode } from "react";
import { useSession as useBetterAuthSession, signIn as betterAuthSignIn, signOut as betterAuthSignOut } from "#/lib/auth-client";

// Infer the return type from Better Auth's useSession
type BetterAuthSessionReturn = ReturnType<typeof useBetterAuthSession>;
type RawSession = NonNullable<BetterAuthSessionReturn["data"]>;

// Better Auth returns { user, session } structure
type Session = RawSession extends { user: infer U; session: infer S } ? { user: U; session: S } : never;

export { betterAuthSignIn as signIn, betterAuthSignOut as signOut };

interface SessionContextValue {
    initialSession: Session | null;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children, initialSession }: { children: ReactNode; initialSession: Session | null }) {
    return <SessionContext.Provider value={{ initialSession }}>{children}</SessionContext.Provider>;
}

/**
 * Unified session hook that returns the most appropriate session.
 * Uses SSR session immediately on first render, then switches to client session.
 * This eliminates loading flicker while maintaining real-time updates.
 */
export function useSession() {
    const context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error("useSession must be used within SessionProvider");
    }

    const { data: clientSession, isPending, error } = useBetterAuthSession();

    // Use client session if available (after hydration), otherwise use SSR session
    const session = isPending && context.initialSession ? context.initialSession : clientSession;

    return {
        data: session,
        isPending: isPending && !context.initialSession,
        error
    };
}
