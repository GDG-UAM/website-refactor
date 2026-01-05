"use client";

import { AuthCard, AuthContainer } from "./AuthLayout.styles";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthContainer>
            <AuthCard>{children}</AuthCard>
        </AuthContainer>
    );
}
