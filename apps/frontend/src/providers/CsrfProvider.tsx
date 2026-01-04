"use client";

import { useEffect } from "react";
import { api } from "#/lib/eden";

export function CsrfProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const initializeCsrf = async () => {
      const hasCookie = document.cookie.includes("XSRF-TOKEN");
      if (!hasCookie) {
        await api.csrf.get();
      }
    };
    initializeCsrf();
  }, []);

  return <>{children}</>;
}
