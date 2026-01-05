import { createAuthClient } from "better-auth/react";
import type { auth } from "backend/src/lib/auth";

// Use internal URL for server-side, public URL for client-side
const isServer = typeof window === "undefined";
const backendURL = isServer
    ? process.env.INTERNAL_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000"
    : process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

// Better Auth needs the full path to auth endpoints
const baseURL = `${backendURL}/api/auth`;

export const authClient = createAuthClient({
    baseURL,
    plugins: []
});

// Export typed hooks with inferred user type
export const { signIn, signUp, signOut } = authClient;

export const useSession = authClient.useSession as () => ReturnType<typeof authClient.useSession> & {
    data: typeof auth.$Infer.Session | null;
};
