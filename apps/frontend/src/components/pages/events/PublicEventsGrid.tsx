"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { EventCard } from "./EventCard";
import { CopyButton, PlainButton } from "#/components/Buttons";
import Modal from "#/components/Modal";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import { useSearchParams, useRouter } from "next/navigation";
import { PageWrapper, Header, Title, Filters, EventsGrid } from "./PublicEventsGrid.styles";
import { getLocale } from "#/paraglide/runtime";
import { useEvents, EventItem } from "#/providers/EventsProvider";
import { m } from "#/paraglide/messages";
import { motion, AnimatePresence } from "framer-motion";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
} as const;

type DateStatus = "upcoming" | "past";

const isUpcoming = (iso: string): boolean => {
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return false;
    return t > Date.now();
};

export function PublicEventsGrid() {
    const locale = getLocale();
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialStatus = (searchParams?.get("status") as DateStatus) || "upcoming";
    const [dateStatus, setDateStatus] = useState<DateStatus>(initialStatus);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [shareModal, setShareModal] = useState<{ isOpen: boolean; event: EventItem | null }>({
        isOpen: false,
        event: null
    });

    const { upcoming, past, fetchEvents } = useEvents();
    const currentData = dateStatus === "upcoming" ? upcoming : past;
    const { items: cachedEvents, isLoading: cacheLoading, error: cacheError } = currentData;

    const ensureLoaded = useCallback(async () => {
        try {
            await Promise.all([fetchEvents("upcoming"), fetchEvents("past")]);
        } catch (e) {
            throw e;
        }
    }, [fetchEvents]);

    // keep URL in sync when status changes
    useEffect(() => {
        const params = new URLSearchParams(searchParams?.toString() || "");
        params.set("status", dateStatus);
        router.replace(`?${params.toString()}`);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateStatus]);

    // Ensure cache is loaded once on first mount
    useEffect(() => {
        let active = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                await ensureLoaded();
            } catch (e) {
                const message = e instanceof Error ? e.message : "Unknown error";
                if (active) setError(message);
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, [ensureLoaded]);

    const filteredEvents = useMemo(() => {
        const source = (cachedEvents ?? []) as EventItem[];
        return source.filter((e) => (dateStatus === "upcoming" ? isUpcoming(e.date.toISOString()) : !isUpcoming(e.date.toISOString())));
    }, [cachedEvents, dateStatus]);

    const sortedEvents = useMemo(() => {
        if (dateStatus === "upcoming") {
            return [...filteredEvents].sort((a, b) => a.date.getTime() - b.date.getTime());
        }
        return [...filteredEvents].sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [filteredEvents, dateStatus]);

    const upcomingCount = useMemo(() => upcoming.items.filter((e) => isUpcoming(e.date.toISOString())).length, [upcoming.items]);
    const pastCount = useMemo(() => past.items.filter((e) => !isUpcoming(e.date.toISOString())).length, [past.items]);

    const handleShareClick = (event: EventItem) => setShareModal({ isOpen: true, event });
    const handleCloseModal = () => setShareModal({ isOpen: false, event: null });

    return (
        <PageWrapper>
            <Header>
                <Title>{m["events.events"]()}</Title>
                <Filters>
                    <PlainButton
                        noBackground
                        style={{ fontSize: "1rem" }}
                        color={dateStatus === "upcoming" ? "primary" : "default"}
                        onClick={() => setDateStatus("upcoming")}
                    >
                        {m["events.filters.upcoming"]({ count: upcomingCount })}
                    </PlainButton>
                    <PlainButton
                        noBackground
                        style={{ fontSize: "1rem" }}
                        color={dateStatus === "past" ? "primary" : "default"}
                        onClick={() => setDateStatus("past")}
                    >
                        {m["events.filters.past"]({ count: pastCount })}
                    </PlainButton>
                </Filters>
            </Header>

            <AnimatePresence mode="popLayout">
                {(loading || cacheLoading) && (
                    <EventsGrid as={motion.div} key={`skeleton-${dateStatus}`} variants={containerVariants} initial="hidden" animate="visible">
                        {Array.from({ length: dateStatus === "upcoming" ? 3 : 6 }).map((_, i) => (
                            <EventCard key={`skeleton-${i}`} skeleton />
                        ))}
                    </EventsGrid>
                )}
            </AnimatePresence>

            {!loading && !error && !cacheLoading && !cacheError && sortedEvents.length === 0 && <p>{m["events.noEvents"]()}</p>}

            {!loading && !error && !cacheLoading && !cacheError && (
                <AnimatePresence mode="popLayout">
                    <EventsGrid
                        as={motion.div}
                        key={`grid-${dateStatus}`}
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.05 }}
                    >
                        {sortedEvents.map((event) => (
                            <EventCard key={event.slug} event={event} onShare={handleShareClick} />
                        ))}
                    </EventsGrid>
                </AnimatePresence>
            )}

            <Modal isOpen={shareModal.isOpen} onClose={handleCloseModal} title={m["events.share.title"]()}>
                <p style={{ marginTop: 0, marginBottom: 32 }}>
                    {shareModal.event &&
                        (() => {
                            let message = m["events.share.description"]({
                                title: shareModal.event.title,
                                date: new Date(shareModal.event.date).toLocaleString(locale, {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: false
                                })
                            }) as string;
                            if (message.endsWith("..")) message = message.slice(0, -1);
                            return message;
                        })()}
                </p>
                <TextField
                    fullWidth
                    variant="outlined"
                    label={m["events.share.linkLabel"]()}
                    value={shareModal.event ? shareModal.event.blogUrl || `${window.location.origin}/events/${shareModal.event.slug}` : ""}
                    slotProps={{
                        input: {
                            readOnly: true,
                            endAdornment: (
                                <InputAdornment position="end">
                                    <CopyButton
                                        content={
                                            shareModal.event ? shareModal.event.blogUrl || `${window.location.origin}/events/${shareModal.event.slug}` : ""
                                        }
                                        iconSize={22}
                                        style={{ marginRight: -8 }}
                                    />
                                </InputAdornment>
                            )
                        }
                    }}
                />
            </Modal>
        </PageWrapper>
    );
}
