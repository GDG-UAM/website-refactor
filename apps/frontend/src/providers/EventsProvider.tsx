"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import { api } from "#/lib/eden";

export type EventItem = NonNullable<Awaited<ReturnType<typeof api.events.get>>["data"]>["items"][number];

interface EventState {
    items: EventItem[];
    isLoading: boolean;
    error: Error | null;
    hasFetched: boolean;
}

interface EventsContextValue {
    upcoming: EventState;
    past: EventState;
    fetchEvents: (dateStatus: "upcoming" | "past") => Promise<void>;
}

const EventsContext = createContext<EventsContextValue | undefined>(undefined);

export function EventsProvider({ children }: { children: ReactNode }) {
    const [upcomingState, setUpcomingState] = useState<EventState>({
        items: [],
        isLoading: false,
        error: null,
        hasFetched: false
    });

    const [pastState, setPastState] = useState<EventState>({
        items: [],
        isLoading: false,
        error: null,
        hasFetched: false
    });

    const fetchEvents = useCallback(async (dateStatus: "upcoming" | "past") => {
        const setState = dateStatus === "upcoming" ? setUpcomingState : setPastState;

        setState((prev) => {
            if (prev.isLoading) return prev;
            return { ...prev, isLoading: true, error: null };
        });

        try {
            const { data, error } = await api.events.get({
                query: { dateStatus, pageSize: 50 }
            });

            if (error) throw error;

            if (data && "items" in data) {
                setState({
                    items: data.items,
                    isLoading: false,
                    error: null,
                    hasFetched: true
                });
            }
        } catch (err) {
            setState((prev) => ({ ...prev, isLoading: false, error: err as Error, hasFetched: true }));
        }
    }, []);

    const value = useMemo(
        () => ({
            upcoming: upcomingState,
            past: pastState,
            fetchEvents
        }),
        [upcomingState, pastState, fetchEvents]
    );

    return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}

export function useEvents<T extends "upcoming" | "past" | undefined = undefined>(dateStatus?: T): T extends undefined ? EventsContextValue : EventState {
    const context = useContext(EventsContext);
    if (!context) throw new Error("useEvents must be used within EventsProvider");

    const { upcoming, past, fetchEvents } = context;

    useEffect(() => {
        if (dateStatus !== "past") {
            if (!upcoming.hasFetched && !upcoming.isLoading) {
                fetchEvents("upcoming");
            }
        }
        if (dateStatus !== "upcoming") {
            if (!past.hasFetched && !past.isLoading) {
                fetchEvents("past");
            }
        }
    }, [dateStatus, upcoming.hasFetched, upcoming.isLoading, past.hasFetched, past.isLoading, fetchEvents]);

    if (dateStatus === undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return context as any;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (dateStatus === "upcoming" ? upcoming : past) as any;
}
