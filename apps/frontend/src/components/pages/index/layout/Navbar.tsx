"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import * as m from "#/paraglide/messages";
import { getLocale } from "#/paraglide/runtime";
import { CollapsableMenuButton } from "#/components/Buttons";
import { AITranslationBanner } from "#/components/ai/translation/AITranslationBanner";
import { useAITranslation } from "#/components/ai/translation/AITranslationProvider";
import { Actions, Bar, Brand, CollapsableMenuWrapper, DesktopNav, DesktopSpacer, Inner, MobileNav, NavItem, NavLinkA, Overlay } from "./Navbar.styles";
import LanguageSwitcher from "./LanguageSwitcher";
import UserMenu from "./UserMenu";

type NavItemDef = { href: string; key: string };

const NAV_ITEMS: NavItemDef[] = [
    { href: "/", key: "home" },
    { href: "/events", key: "events" },
    { href: "/newsletter", key: "newsletter" },
    { href: "/blog", key: "blog" },
    { href: "/about", key: "about" },
    { href: "/contact", key: "contact" }
];
function useLocaleLabels() {
    const locale = getLocale();
    const labels = useMemo(() => {
        const getLabel = (key: string) => {
            const messageKey = `navbar.${key}` as keyof typeof m;
            return m[messageKey] ? (m[messageKey] as () => string)() : key;
        };
        return NAV_ITEMS.map((it) => ({
            href: it.href,
            key: it.key,
            label: getLabel(it.key)
        }));
    }, [locale]);
    return { labels, locale } as const;
}

export default function Navbar() {
    const pathname = usePathname();
    const { labels } = useLocaleLabels();
    const [open, setOpen] = useState(false);
    // Translation active state (used for banner visibility & mobile nav offset)
    const { active: aiActive } = useAITranslation();
    // locale var kept for potential future uses; removed language & AI logic (moved to LanguageSwitcher)

    // Dynamically expose the navbar height as a CSS variable so other components (e.g. settings mobile panel)
    // can position themselves below it even when the AI translation banner changes height.
    const barRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (!barRef.current || typeof window === "undefined") return;
        const el = barRef.current;
        const setVar = () => {
            const h = el.offsetHeight;
            document.documentElement.style.setProperty("--navbar-height", h + "px");
        };
        setVar();
        const ro = new ResizeObserver(setVar);
        ro.observe(el);
        window.addEventListener("orientationchange", setVar);
        window.addEventListener("resize", setVar);
        return () => {
            ro.disconnect();
            window.removeEventListener("orientationchange", setVar);
            window.removeEventListener("resize", setVar);
        };
    }, [aiActive]);

    return (
        <>
            <Overlay $open={open} onClick={() => setOpen(false)} />

            {/* Mobile Nav - outside of Bar */}
            <MobileNav $open={open} $aiActive={aiActive} role="menubar" aria-label={m["navbar.mainNav"]()}>
                {labels.map((it) => {
                    const safePath = pathname ?? "";
                    const active = it.href === "/" ? safePath === "/" : safePath.startsWith(it.href);
                    return (
                        <NavItem role="none" key={it.key}>
                            <NavLinkA role="menuitem" href={it.href} $active={active} onClick={() => setOpen(false)}>
                                {it.label}
                            </NavLinkA>
                        </NavItem>
                    );
                })}
            </MobileNav>

            <Bar ref={barRef}>
                <AITranslationBanner active={aiActive} />
                <Inner>
                    <Brand href="/" aria-label={labels.find((l) => l.key === "home")?.label || "Home"} data-no-ai-translate>
                        <Image src="/logo/32x32.webp" alt="GDG" width={36} height={36} priority />
                        <span className="brand-desktop">{m["navbar.brand.desktop"]()}</span>
                        <span className="brand-mobile">{m["navbar.brand.mobile"]()}</span>
                    </Brand>
                    {/* Desktop Nav */}
                    <DesktopNav role="menubar" aria-label={m["navbar.mainNav"]()}>
                        {labels.map((it) => {
                            const safePath = pathname ?? "";
                            const active = it.href === "/" ? safePath === "/" : safePath.startsWith(it.href);
                            return (
                                <NavItem role="none" key={it.key}>
                                    <NavLinkA role="menuitem" href={it.href} $active={active}>
                                        {it.label}
                                    </NavLinkA>
                                </NavItem>
                            );
                        })}
                    </DesktopNav>

                    <Actions>
                        <DesktopSpacer />
                        <CollapsableMenuWrapper>
                            <CollapsableMenuButton onClick={() => setOpen((v) => !v)} iconSize={18} dontUseContext />
                        </CollapsableMenuWrapper>
                        <LanguageSwitcher onCloseMobileNav={() => setOpen(false)} />
                        <UserMenu />
                    </Actions>
                </Inner>
            </Bar>
        </>
    );
}
