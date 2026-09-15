"use client";

import { useMemo } from "react";
import Image from "next/image";
import * as m from "#/paraglide/messages";
import { getLocale } from "#/paraglide/runtime";
import { ShareButton, SocialMedia } from "#/components/Buttons";
import { newErrorToast, newSuccessToast } from "#/components/Toast";
import LocalTimeWithSettings from "#/components/LocalTimeWithSettings";
import { useEvents } from "#/providers/EventsProvider";
import {
    Avatar,
    Bio,
    CardArrow,
    CardDescription,
    CardText,
    CardTitle,
    Column,
    ExternalCard,
    FeaturedBadge,
    FeaturedImage,
    FeaturedSkeleton,
    GlobalLinksStyle,
    IconBubble,
    InternalCard,
    PageContainer,
    Profile,
    Section,
    SectionTitle,
    ShareWrapper,
    Title
} from "./page.styles";

const CHEVRON_PATH = "M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z";

type Icon = { path: string; viewBox?: string; isPathElement?: boolean };

const materialIcon = (path: string): Icon => ({ path });
const socialIcon = (network: keyof typeof SocialMedia): Icon => ({
    path: SocialMedia[network].iconPath,
    viewBox: SocialMedia[network].viewBox,
    isPathElement: SocialMedia[network].isPathElement
});

type LinkItem = {
    key: string;
    href: string;
    external?: boolean;
    accent: string;
    icon: Icon;
};

const COMMUNITY_LINKS: LinkItem[] = [
    { key: "gdgCommunity", href: "/l/gdg-community", external: true, accent: "var(--google-blue)", icon: socialIcon("gdgCommunity") },
    { key: "whatsapp", href: "/l/whatsapp", external: true, accent: "var(--button-whatsapp-hover-text)", icon: socialIcon("whatsapp") },
    { key: "instagram", href: "/l/instagram", external: true, accent: "var(--button-instagram-hover-text)", icon: socialIcon("instagram") },
    { key: "linkedin", href: "/l/linkedin", external: true, accent: "var(--button-linkedin-hover-text)", icon: socialIcon("linkedinCompany") },
    { key: "email", href: "mailto:gdguam@gmail.com", external: true, accent: "var(--button-email-hover-text)", icon: socialIcon("email") }
];

const EXPLORE_LINKS: LinkItem[] = [
    {
        key: "home",
        href: "/",
        accent: "var(--google-blue)",
        icon: materialIcon("M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z")
    },
    {
        key: "events",
        href: "/events",
        accent: "var(--google-red)",
        icon: materialIcon(
            "M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Z"
        )
    },
    {
        key: "newsletter",
        href: "/newsletter",
        accent: "var(--google-yellow)",
        icon: materialIcon(
            "M160-120q-33 0-56.5-23.5T80-200v-640l67 67 66-67 67 67 67-67 66 67 67-67 67 67 66-67 67 67 67-67 66 67 67-67v640q0 33-23.5 56.5T800-120H160Zm0-80h280v-240H160v240Zm360 0h280v-80H520v80Zm0-160h280v-80H520v80ZM160-520h640v-120H160v120Z"
        )
    },
    {
        key: "blog",
        href: "/blog",
        accent: "var(--google-blue)",
        icon: materialIcon(
            "M280-280h280v-80H280v80Zm0-160h400v-80H280v80Zm0-160h400v-80H280v80Zm-80 480q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z"
        )
    },
    {
        key: "about",
        href: "/about",
        accent: "var(--google-green)",
        icon: materialIcon(
            "M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"
        )
    },
    {
        key: "contact",
        href: "/contact",
        accent: "var(--google-red)",
        icon: materialIcon(
            "M240-400h320v-80H240v80Zm0-120h480v-80H240v80Zm0-120h480v-80H240v80ZM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z"
        )
    }
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.06
        }
    }
} as const;

const itemVariants = {
    hidden: { y: 16, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 260,
            damping: 22
        }
    }
} as const;

const cardMotion = {
    variants: itemVariants,
    whileHover: { y: -3 },
    whileTap: { scale: 0.98 }
} as const;

function SvgIcon({ path, viewBox = "0 -960 960 960", isPathElement }: Icon) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox={viewBox} fill="currentColor" aria-hidden="true">
            {isPathElement ? <g dangerouslySetInnerHTML={{ __html: path }} /> : <path d={path} />}
        </svg>
    );
}

function LinkCard({ item }: { item: LinkItem }) {
    // @ts-ignore
    const title: string = m[`links.items.${item.key}.title`]();
    // @ts-ignore
    const description: string = m[`links.items.${item.key}.description`]();

    const content = (
        <>
            <IconBubble>
                <SvgIcon {...item.icon} />
            </IconBubble>
            <CardText>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardText>
            <CardArrow>
                <SvgIcon path={CHEVRON_PATH} />
            </CardArrow>
        </>
    );

    if (item.external) {
        const isMail = item.href.startsWith("mailto:");
        return (
            <ExternalCard
                href={item.href}
                $accent={item.accent}
                target={isMail ? undefined : "_blank"}
                rel={isMail ? undefined : "noopener noreferrer"}
                {...cardMotion}
            >
                {content}
            </ExternalCard>
        );
    }

    return (
        <InternalCard href={item.href} $accent={item.accent} {...cardMotion}>
            {content}
        </InternalCard>
    );
}

export default function LinksPage() {
    const upcoming = useEvents("upcoming");

    const nextEvent = useMemo(() => {
        if (!upcoming.items.length) return null;
        return upcoming.items.reduce((soonest, event) => (new Date(event.date) < new Date(soonest.date) ? event : soonest));
    }, [upcoming.items]);

    const handleShare = async () => {
        const url = `${window.location.origin}/links`;

        if (navigator.share) {
            try {
                await navigator.share({ title: m["links.title"](), url });
                return;
            } catch (err) {
                // User dismissed the share sheet
                if (err instanceof DOMException && err.name === "AbortError") return;
            }
        }

        try {
            await navigator.clipboard.writeText(url);
            newSuccessToast(m["links.copied"]());
        } catch {
            newErrorToast(url);
        }
    };

    return (
        <PageContainer>
            <GlobalLinksStyle />
            <Column initial="hidden" animate="visible" variants={containerVariants}>
                <Profile variants={itemVariants}>
                    <ShareWrapper>
                        <ShareButton onClick={handleShare} color="default" iconSize={20} dontUseContext />
                    </ShareWrapper>
                    <Avatar>
                        <div>
                            <Image src="/logo/196x196.webp" alt="GDG on Campus UAM" width={80} height={80} priority />
                        </div>
                    </Avatar>
                    <Title data-no-ai-translate>{m["links.title"]()}</Title>
                    <Bio>{m["links.bio"]()}</Bio>
                </Profile>

                {!upcoming.hasFetched || upcoming.isLoading ? (
                    <FeaturedSkeleton aria-hidden="true" />
                ) : (
                    nextEvent && (
                        <InternalCard href={`/events/${nextEvent.slug}`} $accent="var(--google-red)" {...cardMotion}>
                            <FeaturedImage>
                                <Image src={nextEvent.image || "/logo/196x196.webp"} alt="" fill sizes="72px" />
                            </FeaturedImage>
                            <CardText>
                                <FeaturedBadge>{m["links.nextEvent"]()}</FeaturedBadge>
                                <CardTitle>{nextEvent.title}</CardTitle>
                                <CardDescription>
                                    <LocalTimeWithSettings iso={new Date(nextEvent.date).toISOString()} compact locale={getLocale()} />
                                </CardDescription>
                            </CardText>
                            <CardArrow>
                                <SvgIcon path={CHEVRON_PATH} />
                            </CardArrow>
                        </InternalCard>
                    )
                )}

                <Section variants={containerVariants}>
                    <SectionTitle>{m["links.sections.community"]()}</SectionTitle>
                    {COMMUNITY_LINKS.map((item) => (
                        <LinkCard key={item.key} item={item} />
                    ))}
                </Section>

                <Section variants={containerVariants}>
                    <SectionTitle>{m["links.sections.explore"]()}</SectionTitle>
                    {EXPLORE_LINKS.map((item) => (
                        <LinkCard key={item.key} item={item} />
                    ))}
                </Section>
            </Column>
        </PageContainer>
    );
}
