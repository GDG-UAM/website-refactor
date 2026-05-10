"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import LocalTimeWithSettings from "#/components/LocalTimeWithSettings";
import { EventItem } from "#/providers/EventsProvider";
import { ShareButton } from "#/components/Buttons";
import { blurHashToDataURL, isValidBlurHash } from "#/lib/utils/blurhashClient";
import { Card, ImageWrapper, ShareButtonWrapper, Content, Title, Meta } from "./EventCard.styles";

const isUpcoming = (iso: string | Date): boolean => {
    const t = typeof iso === "string" ? Date.parse(iso) : iso.getTime();
    if (Number.isNaN(t)) return false;
    return t > Date.now();
};

const Icon = ({ path }: { path: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor">
        <path d={path} />
    </svg>
);

type EventCardProps = {
    event?: EventItem;
    skeleton?: boolean;
    onShare?: (e: EventItem) => void;
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 260,
            damping: 20
        }
    }
} as const;

export function EventCard({ event, skeleton, onShare }: EventCardProps) {
    const href = !skeleton && event ? event.blogUrl || `/events/${event.slug}` : "#";
    const validBlogUrl = !event?.blogUrl || !event?.blogUrl.startsWith("#");

    // Decode BlurHash to data URL on the client
    // Use card dimensions (350x150) since events don't store image dimensions
    const blurDataURL = useMemo(() => {
        if (!event?.imageBlurHash || !isValidBlurHash(event.imageBlurHash)) return undefined;
        return blurHashToDataURL(event.imageBlurHash, 350, 150);
    }, [event?.imageBlurHash]);

    return (
        <Card
            $skeleton={skeleton}
            variants={itemVariants}
            whileHover={!skeleton ? { scale: 1.02, boxShadow: "0 12px 40px rgba(0, 0, 0, 0.15)" } : {}}
            whileTap={!skeleton ? { scale: 0.98 } : {}}
        >
            <ImageWrapper $skeleton={skeleton}>
                {!skeleton && event ? (
                    <Link href={href} aria-label={event.title} style={{ display: "block", width: "100%", height: "100%" }}>
                        <Image
                            src={event.image || "/logo/196x196.webp"}
                            alt={event.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 350px"
                            style={{ objectFit: "cover" }}
                            placeholder={blurDataURL ? "blur" : "empty"}
                            blurDataURL={blurDataURL}
                        />
                    </Link>
                ) : null}
            </ImageWrapper>

            {!skeleton && event && isUpcoming(event.date) && validBlogUrl && (
                <ShareButtonWrapper $iconSize={20}>
                    <ShareButton
                        onClick={() => onShare?.(event)}
                        iconSize={20}
                        noBackground
                        borderRadius={3.5}
                        hasBorder={false}
                        aria-label={`Share ${event.title}`}
                        style={{ marginTop: "-2px", marginLeft: "-2px" }}
                    />
                </ShareButtonWrapper>
            )}

            <Link href={href} style={{ textDecoration: "none", pointerEvents: skeleton ? "none" : "auto" }} aria-label={event?.title || "Event"}>
                <Content>
                    <Title $skeleton={skeleton}>
                        {skeleton ? (
                            <>
                                <div />
                                <div />
                            </>
                        ) : (
                            event?.title
                        )}
                    </Title>
                    <Meta $skeleton={skeleton}>
                        {skeleton ? (
                            <div style={{ marginTop: 6, width: "60%" }} />
                        ) : (
                            <>
                                <Icon path="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Z" />
                                <LocalTimeWithSettings iso={event!.date.toISOString()} dateOnly={false} />
                            </>
                        )}
                    </Meta>
                    <Meta $skeleton={skeleton}>
                        {skeleton ? (
                            <div style={{ width: "80%" }} />
                        ) : (
                            <>
                                <Icon path="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 294q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z" />
                                <span>{event!.location}</span>
                            </>
                        )}
                    </Meta>
                </Content>
            </Link>
        </Card>
    );
}
