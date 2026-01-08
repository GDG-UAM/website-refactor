"use client";

import { useMemo } from "react";
import HomeHero from "#/components/pages/index/HomeHero";
import EventsTeaser from "#/components/pages/index/EventsTeaser";
import { useEvents } from "#/providers/EventsProvider";

export default function HomePage() {
    const { upcoming, past } = useEvents();

    const combineEvents = useMemo(() => {
        return [...upcoming.items, ...past.items];
    }, [upcoming.items, past.items]);

    const isLoading = upcoming.isLoading || past.isLoading;

    // Map backend event structure to EventsTeaser structure
    const mappedEvents = combineEvents.map((event) => ({
        slug: event.slug,
        title: event.title,
        description: event.description,
        start: event.date,
        location: event.location,
        moreInfoURL: `/events/${event.slug}`,
        joinURL: event.url
    }));

    return (
        <>
            <HomeHero
                joinHref="https://gdg.community.dev/gdg-on-campus-autonomous-university-of-madrid-madrid-spain"
                aboutHref="/about"
                nextSectionId="home-events"
            />
            {!isLoading && <EventsTeaser events={mappedEvents} />}
        </>
    );
}
