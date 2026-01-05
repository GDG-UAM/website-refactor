"use client";

import { useSession } from "#/providers/SessionProvider";
import { authClient } from "#/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import * as m from "#/paraglide/messages";
import Image from "next/image";
import {
    ButtonContainer,
    CancelButton,
    LoadingSpinner,
    LoadingSpinnerContainer,
    LogoContainer,
    SignOutButton,
    Subtitle,
    Title,
    UserEmail,
    UserInfo,
    UserName,
    UserTextInfo
} from "./page.styles";

export default function LogoutPage() {
    const router = useRouter();
    const { data: session, isPending } = useSession();
    const [isLoading, setIsLoading] = useState(false);

    // Redirect if unauthenticated
    useEffect(() => {
        if (session === null && !isPending) {
            router.replace("/");
        }
    }, [session, isPending, router]);

    const handleSignOut = async () => {
        try {
            setIsLoading(true);
            await authClient.signOut();
        } catch (err) {
            console.error("Sign out error:", err);
            router.push("/");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        try {
            if ((window.history?.length || 0) <= 1) router.push("/");
            else router.back();
        } catch {
            router.push("/");
        }
    };

    if (isLoading || isPending) {
        return (
            <>
                <LogoContainer>
                    <Image src="/logo/32x32.webp" alt="GDGoC UAM" width={48} height={48} decoding="async" priority={false} />
                </LogoContainer>
                <Title $variant="logout">{m["auth.logout.loading"]()}</Title>
                <LoadingSpinnerContainer>
                    <LoadingSpinner />
                </LoadingSpinnerContainer>
            </>
        );
    }

    if (!session) return null; // Will redirect

    return (
        <>
            <LogoContainer>
                <Image src="/logo/32x32.webp" alt="GDGoC UAM" width={48} height={48} decoding="async" priority={false} />
            </LogoContainer>

            <Title $variant="logout">{m["auth.logout.title"]()}</Title>
            <Subtitle $variant="logout">{m["auth.logout.subtitle"]()}</Subtitle>

            {session.user && (
                <UserInfo>
                    {session.user.image && (
                        <Image
                            src={session.user.image}
                            alt={session.user.name || session.user.email || ""}
                            width={48}
                            height={48}
                            decoding="async"
                            priority={false}
                            sizes="48px"
                            style={{ borderRadius: "50%", objectFit: "cover" }}
                        />
                    )}
                    <UserTextInfo>
                        <UserName>{session.user.name || session.user.email || ""}</UserName>
                        <UserEmail>{session.user.email}</UserEmail>
                    </UserTextInfo>
                </UserInfo>
            )}

            <ButtonContainer>
                <SignOutButton type="button" onClick={handleSignOut} disabled={isLoading} aria-busy={isLoading}>
                    {isLoading ? <LoadingSpinner /> : m["auth.logout.signOutButton"]()}
                </SignOutButton>

                <CancelButton type="button" onClick={handleCancel}>
                    {m["auth.logout.cancelButton"]()}
                </CancelButton>
            </ButtonContainer>
        </>
    );
}
