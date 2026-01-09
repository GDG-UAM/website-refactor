"use client";

import { useState } from "react";
import { authClient } from "#/lib/auth-client";
import { Button, Spinner, GoogleIcon } from "./GoogleLoginButton.styles";

export type Size = "sm" | "md";

export interface GoogleLoginButtonProps {
    label: string;
    callbackUrl?: string;
    size?: Size;
    fullWidth?: boolean;
    disabled?: boolean;
    startsLoading?: boolean;
}

export default function GoogleLoginButton({ label, callbackUrl, size = "md", fullWidth = false, disabled, startsLoading = false }: GoogleLoginButtonProps) {
    const [loading, setLoading] = useState(startsLoading);

    const onClick = async () => {
        try {
            setLoading(true);
            const cb = callbackUrl || (typeof window !== "undefined" ? window.location.href : "/");
            await authClient.signIn.social({
                provider: "google",
                callbackURL: cb.startsWith("/") ? `${window.location.origin}${cb}` : cb
            });
        } catch (error) {
            console.error("Authentication error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button type="button" onClick={onClick} disabled={disabled || loading} $size={size} $fullWidth={fullWidth}>
            {loading ? <Spinner /> : <GoogleIcon />}
            {label}
        </Button>
    );
}
