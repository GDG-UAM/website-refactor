"use client";

import { useMemo } from "react";
import { ErrorContainer, ErrorTitle, ErrorMessage } from "./global-error.styles";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
    // Fallback i18n without NextIntl context (global error can render outside providers)
    const locale = useMemo(() => {
        if (typeof document === "undefined") return "es";
        const match = document.cookie
            .split(";")
            .map((c) => c.trim())
            .find((c) => c.startsWith("PARAGLIDE_LOCALE="));
        return match?.split("=")[1] || "es";
    }, []);

    const messages = {
        en: { title: "Something went wrong", unexpected: "An unexpected error has occurred." },
        es: { title: "Algo salió mal", unexpected: "Ha ocurrido un error inesperado." }
    } as const;

    const m = messages[locale === "en" ? "en" : "es"];

    return (
        <html>
            <body>
                <ErrorContainer>
                    <ErrorTitle>{m.title}</ErrorTitle>
                    <ErrorMessage>{error?.message || m.unexpected}</ErrorMessage>
                </ErrorContainer>
            </body>
        </html>
    );
}
