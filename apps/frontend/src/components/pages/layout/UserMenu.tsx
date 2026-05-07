"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "#/providers/SessionProvider";
import { useHasSectionPermissions } from "#/providers/PermissionsProvider";
import { useIsJudge } from "#/hooks/useIsJudge";
import * as m from "#/paraglide/messages";
import {
    AvatarButton,
    UserMenuIconSlot as IconSlot,
    UserMenuDivider as Divider,
    UserMenuWrapper as Wrapper,
    UserMenuList as Menu,
    UserMenuItem as MenuItem
} from "./UserMenu.styles";
import { LoginButton } from "#/components/Buttons";
// import { useGiveawaysParticipation } from "#/lib/giveaways/useParticipation";

export default function UserMenu() {
    const { data: session, isPending } = useSession();
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);
    const hasAdminPermissions = useHasSectionPermissions("admin");
    const { isJudge } = useIsJudge();
    // const { participating } = useGiveawaysParticipation({ revalidateOnFocus: false });

    useEffect(() => {
        setMounted(true);
        function handleClick(e: MouseEvent) {
            if (!ref.current) return;
            if (!ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Hook handles fetching/caching; we only show the menu item when authenticated and participating

    // Show login button if no session (whether pending or not)
    if (!session?.user) {
        return (
            <LoginButton
                onClick={() => {
                    signIn.social({ provider: "google", callbackURL: window.location.href });
                }}
                disabled={!mounted || isPending}
                iconSize={18}
            />
        );
    }

    const avatarSrc = typeof session.user.image === "string" ? session.user.image : "/logo/32x32.webp";

    return (
        <Wrapper ref={ref}>
            <AvatarButton aria-haspopup="menu" aria-expanded={open} aria-label={session.user.name || "User menu"} onClick={() => setOpen((v) => !v)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarSrc} alt={session.user.name || "User"} width={34} height={34} style={{ borderRadius: "50%" }} />
            </AvatarButton>
            <Menu role="menu" aria-label={m["navbar.myProfile"]()} $open={open}>
                {hasAdminPermissions && (
                    <MenuItem role="none">
                        <Link role="menuitem" href="/admin" onClick={() => setOpen(false)}>
                            <IconSlot>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="var(--navbar-user-menu-link-text)">
                                    <path d="M680-280q25 0 42.5-17.5T740-340q0-25-17.5-42.5T680-400q-25 0-42.5 17.5T620-340q0 25 17.5 42.5T680-280Zm0 120q31 0 57-14.5t42-38.5q-22-13-47-20t-52-7q-27 0-52 7t-47 20q16 24 42 38.5t57 14.5ZM480-80q-139-35-229.5-159.5T160-516v-244l320-120 320 120v227q-19-8-39-14.5t-41-9.5v-147l-240-90-240 90v188q0 47 12.5 94t35 89.5Q310-290 342-254t71 60q11 32 29 61t41 52q-1 0-1.5.5t-1.5.5Zm200 0q-83 0-141.5-58.5T480-280q0-83 58.5-141.5T680-480q83 0 141.5 58.5T880-280q0 83-58.5 141.5T680-80ZM480-494Z" />
                                </svg>
                            </IconSlot>
                            <span>{m["navbar.adminPanel"]()}</span>
                        </Link>
                    </MenuItem>
                )}
                {hasAdminPermissions && <Divider />}
                {isJudge && (
                    <MenuItem role="none">
                        <Link role="menuitem" href="/evaluations" onClick={() => setOpen(false)}>
                            <IconSlot>
                                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="var(--navbar-user-menu-link-text)">
                                    <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h168q13-36 43.5-58t68.5-22q38 0 68.5 22t43.5 58h168q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm80-80h280v-80H280v80Zm0-160h400v-80H280v80Zm0-160h400v-80H280v80Zm221.5-198.5Q510-807 510-820t-8.5-21.5Q493-850 480-850t-21.5 8.5Q450-833 450-820t8.5 21.5Q467-790 480-790t21.5-8.5ZM200-200v-560 560Z"/>
                                    {/* <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q65 0 123 19t107 53l-58 59q-38-24-81-37.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q133 0 226.5-93.5T800-480q0-18-2-36t-6-35l65-65q11 32 17 66t6 70q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-56-216L254-466l56-56 114 114 400-401 56 56-456 457Z" /> */}
                                </svg>
                            </IconSlot>
                            <span>{m["navbar.evaluations"]()}</span>
                        </Link>
                    </MenuItem>
                )}
                {isJudge && <Divider />}
                <MenuItem role="none">
                    <Link role="menuitem" href={`/user/${session.user.id}`} onClick={() => setOpen(false)}>
                        <IconSlot>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="var(--navbar-user-menu-link-text)">
                                <path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm246-164q-59 0-99.5-40.5T340-580q0-59 40.5-99.5T480-720q59 0 99.5 40.5T620-580q0 59-40.5 99.5T480-440Zm0 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q53 0 100-15.5t86-44.5q-39-29-86-44.5T480-280q-53 0-100 15.5T294-220q39 29 86 44.5T480-160Zm0-360q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm0-60Zm0 360Z" />
                            </svg>
                        </IconSlot>
                        <span>{m["navbar.myProfile"]()}</span>
                    </Link>
                </MenuItem>
                {/* 
                {participating && (
                    <MenuItem role="none">
                        <Link role="menuitem" href="/giveaways" onClick={() => setOpen(false)}>
                            <IconSlot>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="var(--navbar-user-menu-link-text)">
                                    <path d="M160-280v80h640v-80H160Zm0-440h88q-5-9-6.5-19t-1.5-21q0-50 35-85t85-35q30 0 55.5 15.5T460-826l20 26 20-26q18-24 44-39t56-15q50 0 85 35t35 85q0 11-1.5 21t-6.5 19h88q33 0 56.5 23.5T880-640v440q0 33-23.5 56.5T800-120H160q-33 0-56.5-23.5T80-200v-440q0-33 23.5-56.5T160-720Zm0 320h640v-240H596l84 114-64 46-136-184-136 184-64-46 82-114H160v240Zm200-320q17 0 28.5-11.5T400-760q0-17-11.5-28.5T360-800q-17 0-28.5 11.5T320-760q0 17 11.5 28.5T360-720Zm240 0q17 0 28.5-11.5T640-760q0-17-11.5-28.5T600-800q-17 0-28.5 11.5T560-760q0 17 11.5 28.5T600-720Z" />
                                </svg>
                            </IconSlot>
                            <span>{m["navbar.myGiveaways"]()}</span>
                        </Link>
                    </MenuItem>
                )}
                */}
                <MenuItem role="none">
                    <Link role="menuitem" href="/settings" onClick={() => setOpen(false)}>
                        <IconSlot>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="var(--navbar-user-menu-link-text)">
                                <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" />
                            </svg>
                        </IconSlot>
                        <span>{m["navbar.settings"]()}</span>
                    </Link>
                </MenuItem>
                <Divider />
                <MenuItem role="none">
                    <button
                        role="menuitem"
                        onClick={() => {
                            setOpen(false);
                            signOut();
                        }}
                        style={{
                            width: "100%",
                            color: "var(--navbar-user-menu-logout-text)"
                        }}
                    >
                        <IconSlot>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="var(--navbar-user-menu-logout-text)">
                                <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z" />
                            </svg>
                        </IconSlot>
                        <span>{m["navbar.logout"]()}</span>
                    </button>
                </MenuItem>
            </Menu>
        </Wrapper>
    );
}
