import type { Metadata } from "next";
import { Open_Sans, Poppins, Roboto, Lexend } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import { ButtonProvider } from "#/components/Buttons";
import { AITranslationProvider } from "#/components/ai/translation/AITranslationProvider";
import StyledComponentsRegistry from "#/lib/registry";
import * as m from "#/paraglide/messages";
import Footer from "#/components/pages/index/layout/Footer";
import Navbar from "#/components/pages/index/layout/Navbar";
import { SessionProvider } from "#/providers/SessionProvider";
import { getServerSession } from "#/lib/auth-server";

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

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: m["metadata.title"](),
        description: m["metadata.description"]()
    };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const locale = cookieStore.get("PARAGLIDE_LOCALE")?.value || "en";

    // Fetch session server-side for faster initial load
    const { data: session } = await getServerSession();

    return (
        <html lang={locale} className={`${openSans.className} ${poppins.className} ${roboto.className} ${lexend.className}`}>
            <body>
                <StyledComponentsRegistry>
                    <SessionProvider initialSession={session}>
                        <AITranslationProvider sourceLang={locale}>
                            <ButtonProvider>
                                <Navbar />
                                {children}
                                <Footer />
                            </ButtonProvider>
                        </AITranslationProvider>
                    </SessionProvider>
                </StyledComponentsRegistry>
            </body>
        </html>
    );
}
