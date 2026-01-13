import { auth } from "backend/src/lib/auth";
import { headers } from "next/headers";

const baseURL = process.env.INTERNAL_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

/**
 * Server-side session fetcher for Better Auth
 * Use this in Server Components to fetch the session
 */
export async function getServerSession() {
    try {
        const headersList = await headers();
        const cookie = headersList.get("cookie") || "";

        const response = await fetch(`${baseURL}/api/auth/get-session`, {
            method: "GET",
            headers: {
                Cookie: cookie
            },
            cache: "no-store"
        });

        if (!response.ok) {
            return { data: null, error: null };
        }

        const session = (await response.json()) as typeof auth.$Infer.Session;
        return { data: session, error: null };
    } catch (error) {
        console.error("Failed to fetch server session:", error);
        return { data: null, error };
    }
}
