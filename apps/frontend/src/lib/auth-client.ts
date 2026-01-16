import { createAuthClient } from "better-auth/react";
import type { auth } from "backend/src/lib/auth";
import { adminClient } from "better-auth/client/plugins";

const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

// Better Auth needs the full path to auth endpoints
const baseURL = `${backendURL}/api/auth`;

export const authClient = createAuthClient({
    baseURL,
    plugins: [adminClient()]
});

// Export typed hooks with inferred user type
export const { signIn, signUp, signOut } = authClient;

export const useSession = authClient.useSession as () => ReturnType<typeof authClient.useSession> & {
    data: typeof auth.$Infer.Session | null;
};
