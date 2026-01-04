import { treaty } from "@elysiajs/eden";
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
