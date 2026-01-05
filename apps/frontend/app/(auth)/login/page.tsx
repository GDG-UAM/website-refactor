"use client";

import { useSession } from "#/providers/SessionProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import * as m from "#/paraglide/messages";
import Image from "next/image";
import GoogleLoginButton from "#/components/auth/GoogleLoginButton";
import { LogoContainer, Subtitle, Title } from "./page.styles";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, isPending } = useSession();
    const [isLoading, setIsLoading] = useState(false);

    // Sync loading state on client only to avoid hydration mismatch
    useEffect(() => {
        setIsLoading(isPending);
    }, [isPending]);

    const validatedCallbackUrl = useMemo(() => {
        const raw = searchParams?.get("callbackUrl") || "/";
        try {
            // Allow only same-origin or relative paths
            const u = new URL(raw, typeof window !== "undefined" ? window.location.origin : "http://x");
            const sameOrigin = typeof window === "undefined" || u.origin === window.location.origin;
            return sameOrigin ? u.pathname + u.search + u.hash : "/";
        } catch {
            return "/";
        }
    }, [searchParams]);

    console.log(validatedCallbackUrl);

    // Redirect if already authenticated
    useEffect(() => {
        if (session) {
            router.replace(validatedCallbackUrl);
        }
    }, [session, router, validatedCallbackUrl]);

    return (
        <>
            <LogoContainer>
                <Image src="/logo/32x32.webp" alt="GDGoC UAM" width={48} height={48} decoding="async" priority={false} />
            </LogoContainer>

            <Title $variant="login">{m["auth.login.title"]()}</Title>
            <Subtitle $variant="login">{m["auth.login.subtitle"]()}</Subtitle>

            <GoogleLoginButton label={m["auth.login.googleButton"]()} callbackUrl={validatedCallbackUrl} fullWidth startsLoading={isLoading} />
        </>
    );
}
