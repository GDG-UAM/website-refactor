import { treaty } from "@elysiajs/eden";
import { headers } from "next/headers";
import { cache } from "react";
import type { App } from "backend";

const getCachedHeaders = cache(async () => {
    return await headers();
});

export const serverApi = treaty<App>(process.env.INTERNAL_BACKEND_URL || "http://localhost:3000", {
    onRequest: async (path, options) => {
        const headersList = await getCachedHeaders();

        const headersToForward = ["authorization", "cookie", "user-agent", "x-forwarded-for", "x-real-ip", "accept-language"];

        const forwardedHeaders: Record<string, string> = {};
        headersToForward.forEach((headerName) => {
            const value = headersList.get(headerName);
            if (value) {
                forwardedHeaders[headerName] = value;
            }
        });

        options.headers = {
            ...options.headers,
            ...forwardedHeaders,
            "x-internal-secret": process.env.INTERNAL_API_SECRET || ""
        };
    }
}).api;
