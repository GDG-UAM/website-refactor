import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CsrfProvider } from "#/providers/CsrfProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GDG UAM",
  description: "Refactored with Next.js and Elysia",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CsrfProvider>{children}</CsrfProvider>
      </body>
    </html>
  );
}
