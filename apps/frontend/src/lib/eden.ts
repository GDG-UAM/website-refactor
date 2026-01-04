import { treaty } from "@elysiajs/eden";
import { headers } from "next/headers";
import type { App } from "backend";

const getCookie = (name: string) => {
  if (typeof document === "undefined") return null;
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
};

const isServer = typeof window === "undefined";

const getBaseUrl = () => {
  if (isServer) {
    // Server-side: Use internal Docker network URL
    // Fallback to localhost for local development outside Docker
    return process.env.INTERNAL_BACKEND_URL || "http://localhost:3000";
  }
  // Browser-side: Use the public-facing URL
  return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
};

// Client-side API instance
export const api = treaty<App>(getBaseUrl(), {
  onRequest: async (path, options) => {
    // CSRF protection only applies to browser-side mutations
    if (!isServer) {
      const token = getCookie("XSRF-TOKEN");
      const isMutation = !["GET", "HEAD", "OPTIONS"].includes(
        options.method || "",
      );

      if (token && isMutation) {
        options.headers = {
          ...options.headers,
          "x-xsrf-token": token,
        };
      }
    }
  },
});

// Server-side API instance that forwards user headers
export const getServerApi = async () => {
  const headersList = await headers();

  // Headers to forward from the user's request
  const headersToForward = [
    "authorization",
    "cookie",
    "user-agent",
    "x-forwarded-for",
    "x-real-ip",
    "accept-language",
  ];

  const forwardedHeaders: Record<string, string> = {};
  headersToForward.forEach((headerName) => {
    const value = headersList.get(headerName);
    if (value) {
      forwardedHeaders[headerName] = value;
    }
  });

  return treaty<App>(getBaseUrl(), {
    onRequest: async (path, options) => {
      // Forward user headers to backend
      options.headers = {
        ...options.headers,
        ...forwardedHeaders,
        // Add shared secret for internal server-to-server authentication
        "x-internal-secret": process.env.INTERNAL_API_SECRET || "",
      };
    },
  });
};
