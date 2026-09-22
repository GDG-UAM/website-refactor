import { NextRequest, NextResponse } from "next/server";

function getBestMatchingLanguage(acceptLanguageHeader: string | null): string {
    if (!acceptLanguageHeader) return "en";

    // Parse Accept-Language header (e.g., "es-ES,es;q=0.9,en;q=0.8")
    const languages = acceptLanguageHeader
        .split(",")
        .map((lang) => {
            const [locale, qValue] = lang.trim().split(";");
            const quality = qValue ? parseFloat(qValue.split("=")[1]) : 1.0;
            const langCode = locale.split("-")[0].toLowerCase();
            return { langCode, quality };
        })
        .sort((a, b) => b.quality - a.quality); // Sort by quality (highest first)

    // Find first matching language
    for (const { langCode } of languages) {
        if (langCode === "es" || langCode === "en") {
            return langCode;
        }
    }

    return "en"; // Default fallback
}

export function middleware(request: NextRequest) {
    // Some in-app browsers (Instagram, DuckDuckGo) don't upgrade to HTTPS on their own. On http:// the page's origin
    // doesn't match the https:// backend URL, so every API call is blocked by CORS
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    if (process.env.NODE_ENV === "production" && request.headers.get("x-forwarded-proto") === "http" && host) {
        const { pathname, search } = request.nextUrl;
        return NextResponse.redirect(`https://${host.split(":")[0]}${pathname}${search}`, 308);
    }

    const cookieLang = request.cookies.get("PARAGLIDE_LOCALE")?.value;

    // If cookie exists and is valid, use it
    if (cookieLang && ["en", "es"].includes(cookieLang)) {
        return NextResponse.next();
    }

    // Otherwise, determine from Accept-Language header
    const acceptLanguage = request.headers.get("accept-language");
    const bestLang = getBestMatchingLanguage(acceptLanguage);

    const response = NextResponse.next();

    // Set cookie with the determined language
    response.cookies.set("PARAGLIDE_LOCALE", bestLang, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365 // 1 year
    });

    return response;
}

export const config = {
    matcher: ["/((?!api|_next|.*\\..*).*)"]
};
