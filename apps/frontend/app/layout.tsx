import type { Metadata } from "next";
import { Open_Sans, Poppins, Roboto, Lexend, Montserrat } from "next/font/google";
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

const openSans = Open_Sans({
    subsets: ["latin"],
    weight: ["400", "600"],
    display: "swap"
});
const poppins = Poppins({
    subsets: ["latin"],
    weight: ["600", "700"],
    display: "swap"
});
const roboto = Roboto({
    subsets: ["latin"],
    weight: ["400", "500"],
    display: "swap"
});
const lexend = Lexend({
    subsets: ["latin"],
    weight: ["400", "500"],
    display: "swap"
});
export const montserrat = Montserrat({
    subsets: ["latin"],
    weight: ["400", "600", "700", "800", "900"]
});

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
