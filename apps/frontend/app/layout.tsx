import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import { cookies } from "next/headers";
import { ButtonProvider } from "#/components/Buttons";
import { ToastProvider } from "#/components/Toast";
import { AITranslationProvider } from "#/components/ai/translation/AITranslationProvider";
import StyledComponentsRegistry from "#/lib/registry";
import * as m from "#/paraglide/messages";
import Footer from "#/components/pages/layout/Footer";
import Navbar from "#/components/pages/layout/Navbar";
import { SessionProvider } from "#/providers/SessionProvider";
import { PermissionProvider } from "#/providers/PermissionsProvider";
import { SettingsProvider } from "#/providers/SettingsProvider";
import { setLocale, locales as availableLanguageTags } from "#/paraglide/runtime";
import { CustomThemeProvider } from "#/providers/ThemeProvider";
import { ArticlesProvider } from "#/providers/ArticlesProvider";
import { EventsProvider } from "#/providers/EventsProvider";
import { getServerSession } from "#/lib/auth-server";
import { AccessibilityAttributes, accessibilityScript } from "#/components/AccessibilityAttributes";
import { ImpersonationPill } from "#/components/ImpersonationPill";

// Self-hosted (latin subset) so builds never depend on Google Fonts (see vercel/next.js#99114)
const openSans = localFont({ src: "../src/fonts/open-sans-400-600.woff2", weight: "400 600" });
const poppins = localFont({
    src: [
        { path: "../src/fonts/poppins-600.woff2", weight: "600" },
        { path: "../src/fonts/poppins-700.woff2", weight: "700" }
    ]
});
const roboto = localFont({ src: "../src/fonts/roboto-400-500.woff2", weight: "400 500" });
const lexend = localFont({ src: "../src/fonts/lexend-400-500.woff2", weight: "400 500" });

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: m["metadata.title"](),
        description: m["metadata.description"]()
    };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const locale = (cookieStore.get("PARAGLIDE_LOCALE")?.value as any) || "en";

    // Set paraglide locale for server-side rendering of client components
    if (availableLanguageTags.includes(locale)) {
        setLocale(locale);
    }

    // Fetch session server-side for faster initial load
    const { data: session } = await getServerSession();

    return (
        <html lang={locale} className={`${openSans.className} ${poppins.className} ${roboto.className} ${lexend.className}`} suppressHydrationWarning>
            <body>
                <Script id="accessibility-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: accessibilityScript }} />
                <StyledComponentsRegistry>
                    <SessionProvider initialSession={session}>
                        <PermissionProvider>
                            <ArticlesProvider>
                                <EventsProvider>
                                    <SettingsProvider>
                                        <ButtonProvider>
                                            <ToastProvider>
                                                <AccessibilityAttributes />
                                                <CustomThemeProvider>
                                                    <AITranslationProvider sourceLang={locale}>
                                                        <Navbar locale={locale} />
                                                        <main>{children}</main>
                                                        <Footer />
                                                        <ImpersonationPill />
                                                    </AITranslationProvider>
                                                </CustomThemeProvider>
                                            </ToastProvider>
                                        </ButtonProvider>
                                    </SettingsProvider>
                                </EventsProvider>
                            </ArticlesProvider>
                        </PermissionProvider>
                    </SessionProvider>
                </StyledComponentsRegistry>
            </body>
        </html>
    );
}
