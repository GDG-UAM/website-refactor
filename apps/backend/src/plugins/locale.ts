import { Elysia } from "elysia";

export const localePlugin = (app: Elysia) =>
    app.derive(({ cookie: { PARAGLIDE_LOCALE } }) => {
        return {
            locale: (PARAGLIDE_LOCALE?.value as string) || "en" // Default to English
        };
    });
