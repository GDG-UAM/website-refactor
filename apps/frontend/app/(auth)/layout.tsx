import AuthLayout from "#/components/auth/AuthLayout";
import { buildSectionMetadata } from "#/lib/metadata";

export async function generateMetadata() {
    return buildSectionMetadata("auth");
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <AuthLayout>{children}</AuthLayout>;
}
