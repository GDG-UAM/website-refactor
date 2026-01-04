import { treaty } from "@elysiajs/eden";
import type { App } from "backend";

const getCookie = (name: string) => {
  if (typeof document === "undefined") return null;
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
};

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

let csrfReady: Promise<void> | null = null;

if (typeof window !== "undefined") {
  csrfReady = (async () => {
    const hasCookie = document.cookie.includes("XSRF-TOKEN");
    if (!hasCookie) {
      await fetch(`${baseURL}/csrf`, {
        credentials: "include",
      });
    }
  })();
}

// Client-side API instance
export const api = treaty<App>(baseURL, {
  fetch: {
    credentials: "include",
  },
  onRequest: async (path, options) => {
    if (csrfReady) {
      await csrfReady;
    }

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
  },
});
