"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PlainButton } from "#/components/Buttons";
import { ExternalLinkIcon } from "#/components/ExternalLinkIcon";
import LocalTimeWithSettings from "#/components/LocalTimeWithSettings";
import {
    Axis,
    Badge,
    BrandColor,
    Bullets,
    Card,
    CardFooter,
    CardHeader,
    // CardSubtitle,
    CardTitle,
    Copy,
    Cursor,
    CursorLabel,
    DateText,
    // Desc,
    Eyebrow,
    Grid,
    Header,
    LocationText,
    Meta,
    MetaRow,
    Month,
    Months,
    PointButton,
    PointItem,
    Points,
    Section,
    SrOnly,
    Tick,
    Timeline,
    TimelinePadding,
    VacationLabel,
    VacationLine
} from "./EventsTeaser.styles";
import Link from "next/link";
import * as m from "#/paraglide/messages";
import { RichText } from "#/components/RichText";
import { getLocale } from "#/paraglide/runtime";

interface EventItem {
    slug: string;
    title: string;
    description?: string;
    start: string | Date;
    location?: string;
    joinURL?: string;
    moreInfoURL?: string;
    color?: BrandColor;
}

interface EventsTeaserProps {
    events: EventItem[];
    periodMonths?: 3 | 4;
    rotateMs?: number;
    className?: string;
    timeZone?: string;
}

// ---------- Helpers de fecha ----------
const ms = (d: Date) => d.getTime();

function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function addMonths(d: Date, n: number) {
    const newDate = new Date(d);
    newDate.setMonth(d.getMonth() + n);
    return newDate;
}

function addDays(d: Date, n: number) {
    const newDate = new Date(d);
    newDate.setDate(d.getDate() + n);
    return newDate;
}

function clamp01(x: number) {
    return Math.max(0, Math.min(1, x));
}

function percentBetween(start: Date, end: Date, target: Date) {
    const p = (ms(target) - ms(start)) / (ms(end) - ms(start));
    return clamp01(p) * 100;
}

function toDate(x: string | Date) {
    return x instanceof Date ? x : new Date(x);
}

function monthLabel(d: Date, locale = "es-ES") {
    const s = new Intl.DateTimeFormat(locale, { month: "short" }).format(d);
    return s.toUpperCase();
}

function formatReadableDate(d: Date, locale = "es-ES", timeZone = "Europe/Madrid") {
    const dow = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone }).format(d);
    const day = new Intl.DateTimeFormat(locale, { day: "2-digit", timeZone }).format(d);
    const mon = new Intl.DateTimeFormat(locale, { month: "short", timeZone }).format(d);
    const hm = new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        timeZone,
        hour12: false
    }).format(d);
    return `${capitalize(dow)}, ${day} ${mon} · ${hm}`;
}
function capitalize(s: string) {
    return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

// ---------- Icon Component ----------
const Icon = ({ path }: { path: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor" aria-hidden>
        <path d={path} />
    </svg>
);

// ---------- Animation Variants ----------
const cardContentVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 50 : -50,
        opacity: 0
    }),
    center: {
        x: 0,
        opacity: 1
    },
    exit: (direction: number) => ({
        x: direction > 0 ? -50 : 50,
        opacity: 0
    })
};

const textOnlyVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 20 : -20,
        opacity: 0
    }),
    center: {
        x: 0,
        opacity: 1
    },
    exit: (direction: number) => ({
        x: direction > 0 ? -20 : 20,
        opacity: 0
    })
};

const badgeVariants = {
    enter: {
        y: -20,
        opacity: 0
    },
    center: {
        y: 0,
        opacity: 1
    },
    exit: {
        y: -20,
        opacity: 0
    }
};

// ---------- Componente ----------
const FALLBACK_COMMUNITY_URL = "https://gdguam.es/l/gdg-community";

export default function EventsTeaser({ events, periodMonths = 3, rotateMs = 3000, className, timeZone = "Europe/Madrid" }: EventsTeaserProps) {
    const locale = getLocale();
    const [isSmallScreen, setIsSmallScreen] = useState(false);

    const [screenWidth, setScreenWidth] = useState(1200);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 768px)");
        setIsSmallScreen(mediaQuery.matches);
        setScreenWidth(window.innerWidth);

        const mqHandler = (e: MediaQueryListEvent) => setIsSmallScreen(e.matches);
        const resHandler = () => setScreenWidth(window.innerWidth);

        mediaQuery.addEventListener("change", mqHandler);
        window.addEventListener("resize", resHandler);

        return () => {
            mediaQuery.removeEventListener("change", mqHandler);
            window.removeEventListener("resize", resHandler);
        };
    }, []);

    const now = useMemo(() => {
        const day = new Date();
        day.setHours(0, 0, 0, 0);
        return day;
    }, []);

    const { periodStart, periodEnd } = useMemo(() => {
        const periodStart = startOfMonth(addDays(now, -15));
        const periodEnd = endOfMonth(addMonths(periodStart, periodMonths - (isSmallScreen ? 1 : 0)));
        return { periodStart, periodEnd };
    }, [isSmallScreen, now, periodMonths]);

    // Eventos dentro del periodo (ordenados por fecha asc)
    const eventsInPeriod = useMemo(() => {
        return [...events]
            .map((e) => ({ ...e, startDate: toDate(e.start) }))
            .filter((e) => ms(e.startDate) >= ms(periodStart) && ms(e.startDate) <= ms(periodEnd))
            .sort((a, b) => ms(a.startDate) - ms(b.startDate));
    }, [events, periodStart, periodEnd]);

    const nearestEventSlug = useMemo(() => {
        if (eventsInPeriod.length === 0) return undefined;
        const future = eventsInPeriod.filter((e) => ms(e.startDate) >= ms(now));
        if (future.length) {
            let best = future[0];
            for (const e of future) {
                if (ms(e.startDate) - ms(now) < ms(best.startDate) - ms(now)) best = e;
            }
            return best.slug;
        }
        return "";
    }, [eventsInPeriod, now]);

    // Puntos con su % X sobre el eje
    const points = useMemo(() => {
        const colors: BrandColor[] = ["blue", "green", "red", "yellow"];
        return eventsInPeriod.map((e, index) => ({
            ...e,
            x: percentBetween(periodStart, periodEnd, e.startDate),
            color: e.color ?? colors[index % colors.length]
        }));
    }, [eventsInPeriod, periodStart, periodEnd]);

    // Meses del eje
    const months = useMemo(() => {
        const monthItems: { date: Date; x: number; label: string }[] = [];
        const currentDate = startOfMonth(periodStart);

        while (currentDate < periodEnd) {
            monthItems.push({
                date: new Date(currentDate),
                x: percentBetween(periodStart, periodEnd, currentDate),
                label: monthLabel(currentDate, locale)
            });
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        const finalMonth = startOfMonth(addDays(periodEnd, 1));
        monthItems.push({
            date: finalMonth,
            x: 100,
            label: monthLabel(finalMonth, locale)
        });

        return monthItems;
    }, [periodStart, periodEnd, locale]);

    // Cursor "You are here"
    const todayPercent = useMemo(() => percentBetween(periodStart, periodEnd, now), [periodStart, periodEnd, now]);

    const eventGap = useMemo(() => {
        const gap = 2162 / screenWidth + 1.25;
        return Math.max(3, Math.min(10, Math.round(gap)));
    }, [screenWidth]);

    // Vacation periods logic
    const vacationSections = useMemo(() => {
        const rawSections: {
            start: Date;
            end: Date;
            title: string;
            color: string;
            labelColor: string;
            groupId: string;
        }[] = [];

        const startYear = periodStart.getFullYear();
        const endYear = periodEnd.getFullYear();

        for (let year = startYear - 1; year <= endYear; year++) {
            const defs = [
                {
                    id: `summer-${year}`,
                    title: m["index.events.summerBreak"](),
                    start: new Date(year, 5, 1), // 1 June
                    end: new Date(year, 7, 31, 21, 59, 59), // 31 August
                    color: "#fdd663",
                    labelColor: "#b06000"
                },
                {
                    id: `winter-${year}`,
                    title: m["index.events.winterBreak"](),
                    start: new Date(year, 11, 23),
                    end: new Date(year + 1, 0, 25, 23, 59, 59),
                    color: "#aecbfa",
                    labelColor: "#1967d2"
                }
            ];

            defs.forEach((v) => {
                // Initial section
                let currentSections = [{ start: v.start, end: v.end }];

                // Cut by events
                points.forEach((p) => {
                    const eventDate = p.startDate;
                    const cutStart = addDays(eventDate, -eventGap);
                    const cutEnd = addDays(eventDate, eventGap);

                    const nextSections: { start: Date; end: Date }[] = [];
                    currentSections.forEach((sec) => {
                        if (cutEnd <= sec.start || cutStart >= sec.end) {
                            nextSections.push(sec);
                        } else {
                            if (cutStart > sec.start) {
                                nextSections.push({ start: sec.start, end: cutStart });
                            }
                            if (cutEnd < sec.end) {
                                nextSections.push({ start: cutEnd, end: sec.end });
                            }
                        }
                    });
                    currentSections = nextSections;
                });

                // Add to raw list if they overlap with period view
                currentSections.forEach((sec) => {
                    const clipStart = new Date(Math.max(ms(sec.start), ms(periodStart)));
                    const clipEnd = new Date(Math.min(ms(sec.end), ms(periodEnd)));

                    if (clipStart < clipEnd) {
                        rawSections.push({
                            start: clipStart,
                            end: clipEnd,
                            title: v.title,
                            color: v.color,
                            labelColor: v.labelColor,
                            groupId: v.id
                        });
                    }
                });
            });
        }

        // For each groupId, find the longest section and keep the title only there
        const groups = new Set(rawSections.map((s) => s.groupId));
        const finalSections = rawSections.map((s) => ({ ...s, showTitle: false }));

        groups.forEach((gid) => {
            const groupSections = finalSections.filter((s) => s.groupId === gid);
            if (groupSections.length === 0) return;

            let longest = groupSections[0];
            groupSections.forEach((s) => {
                if (ms(s.end) - ms(s.start) > ms(longest.end) - ms(longest.start)) {
                    longest = s;
                }
            });

            // Only show title if duration is > 15 days (heuristic for space)
            // Wait, "If space is sufficient"
            // Let's check the width in percentage
            const widthPct = percentBetween(periodStart, periodEnd, longest.end) - percentBetween(periodStart, periodEnd, longest.start);
            if (widthPct > 10) {
                // 10% of timeline width seems reasonable for a short label
                longest.showTitle = true;
            }
        });

        return finalSections;
    }, [periodStart, periodEnd, points, eventGap]);

    // Estado de selección/rotación
    const [activeSlug, setActiveSlug] = useState<string | undefined>(nearestEventSlug);
    const [paused, setPaused] = useState(false);
    const rotRef = useRef<number | null>(null);
    const [direction, setDirection] = useState(0);

    // Helpers to pause/resume rotation instantly (avoid interval race on hover)
    const pauseRotation = () => {
        if (rotRef.current) {
            window.clearInterval(rotRef.current);
            rotRef.current = null;
        }
        setPaused(true);
    };
    const resumeRotation = () => setPaused(false);

    // Sincronizar activeSlug cuando cambia nearest
    useEffect(() => {
        if (!activeSlug && nearestEventSlug) setActiveSlug(nearestEventSlug);
    }, [nearestEventSlug, activeSlug]);

    // Rotación automática
    useEffect(() => {
        if (paused || points.length === 0) return;
        if (rotRef.current) {
            window.clearInterval(rotRef.current);
        }
        rotRef.current = window.setInterval(() => {
            setActiveSlug((prev) => {
                if (!prev) {
                    setDirection(1);
                    return points[0].slug;
                }
                const idx = points.findIndex((p) => p.slug === prev);
                if (idx === -1) {
                    setDirection(1);
                    return points[0].slug;
                }
                setDirection(1);
                return points[(idx + 1) % points.length].slug;
            });
        }, rotateMs) as unknown as number;
        return () => {
            if (rotRef.current) window.clearInterval(rotRef.current);
        };
    }, [points, rotateMs, paused]);

    // Datos del evento activo
    const activeEvent = useMemo(() => points.find((p) => p.slug === activeSlug) ?? points[0], [points, activeSlug]);

    // Accesibilidad: seleccionar con teclado o hover
    const onPointEnter = (slug: string) => {
        pauseRotation();
        const currentIdx = points.findIndex((p) => p.slug === activeSlug);
        const newIdx = points.findIndex((p) => p.slug === slug);
        setDirection(newIdx > currentIdx ? 1 : -1);
        setActiveSlug(slug);
    };
    const onPointFocus = (slug: string) => {
        pauseRotation();
        const currentIdx = points.findIndex((p) => p.slug === activeSlug);
        const newIdx = points.findIndex((p) => p.slug === slug);
        setDirection(newIdx > currentIdx ? 1 : -1);
        setActiveSlug(slug);
    };
    const onPointBlur = () => resumeRotation();

    const openLink = (url: string, newTab: boolean = true) => {
        window.open(url, newTab ? "_blank" : "_self");
    };

    const eventHref = "/events";

    return (
        <Section id="home-events" className={className} aria-labelledby="home-events__title" data-theme="light-google">
            <Header>
                <Eyebrow>{m["index.events.eyebrow"]()}</Eyebrow>
                <h2 id="home-events__title">{m["index.events.nextEvents"]()}</h2>
            </Header>

            <Grid role="group" aria-labelledby="home-events__title">
                <Copy>
                    <p>
                        <RichText
                            text={m["index.events.mainCopy"]()}
                            components={{
                                link: (
                                    <Link className="intext" href="/events">
                                        {m["index.events.mainCopy_events"]()}
                                    </Link>
                                )
                            }}
                        />
                    </p>
                    <Bullets>
                        <li>{m["index.events.copyBullets._0"]()}</li>
                        <li>{m["index.events.copyBullets._1"]()}</li>
                        <li>{m["index.events.copyBullets._2"]()}</li>
                    </Bullets>
                    <PlainButton hasBorder slim onClick={() => openLink(eventHref, false)}>
                        {m["index.events.seeAll"]()}
                    </PlainButton>
                </Copy>

                <Card aria-live="polite" aria-atomic="true">
                    <AnimatePresence mode="wait">
                        {activeEvent?.slug === nearestEventSlug && (
                            <motion.div
                                key="next-badge"
                                variants={badgeVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.2 }}
                                style={{ position: "absolute", top: "8px", right: "8px" }}
                            >
                                <Badge $visible={true}>{m["index.events.nextEvent"]()}</Badge>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <AnimatePresence mode="wait">
                        {activeEvent?.startDate < now && (
                            <motion.div
                                key="past-badge"
                                variants={badgeVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.2 }}
                                style={{ position: "absolute", top: "8px", right: "8px" }}
                            >
                                <Badge $visible={true} $past>
                                    {m["index.events.pastEvent"]()}
                                </Badge>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <CardHeader>
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={activeSlug}
                                custom={direction}
                                variants={cardContentVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: "spring", stiffness: 300, damping: 30 },
                                    opacity: { duration: 0.2 }
                                }}
                            >
                                <CardTitle>{activeEvent?.title}</CardTitle>
                            </motion.div>
                        </AnimatePresence>
                        {/* {activeEvent?.description && <CardSubtitle>{activeEvent.description}</CardSubtitle>} */}
                    </CardHeader>

                    <Meta>
                        <MetaRow>
                            <dd>
                                <DateText>
                                    <Icon path="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Z" />
                                    <AnimatePresence mode="wait" custom={direction}>
                                        <motion.span
                                            key={activeSlug + "-date"}
                                            custom={direction}
                                            variants={textOnlyVariants}
                                            initial="enter"
                                            animate="center"
                                            exit="exit"
                                            transition={{
                                                x: { type: "spring", stiffness: 300, damping: 30 },
                                                opacity: { duration: 0.2 }
                                            }}
                                            style={{ display: "inline-block" }}
                                        >
                                            <LocalTimeWithSettings
                                                iso={(activeEvent?.startDate ?? now).toISOString()}
                                                dateOnly={false}
                                                compact
                                                locale={locale}
                                                timeZone={timeZone}
                                            />
                                        </motion.span>
                                    </AnimatePresence>
                                </DateText>
                            </dd>
                        </MetaRow>
                        {activeEvent?.location && (
                            <MetaRow>
                                <dd>
                                    <LocationText>
                                        <Icon path="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 294q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z" />
                                        <AnimatePresence mode="wait" custom={direction}>
                                            <motion.span
                                                key={activeSlug + "-location"}
                                                custom={direction}
                                                variants={textOnlyVariants}
                                                initial="enter"
                                                animate="center"
                                                exit="exit"
                                                transition={{
                                                    x: { type: "spring", stiffness: 300, damping: 30 },
                                                    opacity: { duration: 0.2 }
                                                }}
                                                style={{ display: "inline-block" }}
                                            >
                                                {activeEvent.location}
                                            </motion.span>
                                        </AnimatePresence>
                                    </LocationText>
                                </dd>
                            </MetaRow>
                        )}
                    </Meta>

                    <CardFooter>
                        <PlainButton
                            hasBorder
                            slim
                            onClick={() => openLink(activeEvent?.joinURL || FALLBACK_COMMUNITY_URL, true)}
                            aria-label={m["index.events.join"]()}
                            color="primary"
                            disabled={activeEvent?.startDate < now}
                        >
                            <span>
                                {m["index.events.join"]()}
                                <ExternalLinkIcon />
                            </span>
                        </PlainButton>
                        <PlainButton
                            hasBorder
                            slim
                            onClick={() => openLink(activeEvent.moreInfoURL as string, false)}
                            aria-label={m["index.events.moreInfo"]()}
                            noBackground={true}
                            color="secondary"
                            disabled={!activeEvent?.moreInfoURL || activeEvent?.moreInfoURL === "#"}
                        >
                            {m["index.events.moreInfo"]()}
                        </PlainButton>
                    </CardFooter>
                </Card>
            </Grid>

            {/* Timeline */}
            <TimelinePadding>
                <Timeline role="group" aria-labelledby="timeline__label" onMouseEnter={pauseRotation} onMouseLeave={resumeRotation}>
                    <SrOnly as="h3" id="timeline__label">
                        {m["index.events.timeline"]()}
                    </SrOnly>

                    <Axis aria-hidden="true" data-range-start={periodStart.toISOString()} data-range-end={periodEnd.toISOString()}>
                        <Months>
                            {months.map((month) => (
                                <Month key={month.date.toISOString()} data-edge={month.x === 0 || month.x === 100} style={{ left: `${month.x}%` }}>
                                    <Tick />
                                    <span>{month.label}</span>
                                </Month>
                            ))}
                        </Months>

                        {/* Vacation periods */}
                        {vacationSections.map((sec, i) => {
                            const left = percentBetween(periodStart, periodEnd, sec.start);
                            const right = percentBetween(periodStart, periodEnd, sec.end);
                            return (
                                <VacationLine
                                    key={`${sec.groupId}-${i}`}
                                    $color={sec.color}
                                    style={{ left: `${left}%`, width: `${right - left}%` }}
                                >
                                    {sec.showTitle && <VacationLabel style={{ color: sec.labelColor }}>{sec.title}</VacationLabel>}
                                </VacationLine>
                            );
                        })}

                        {/* Place points inside the Axis so they align to the top border */}
                        <Points role="listbox" aria-label="Eventos cercanos">
                            {points.map((p) => {
                                const selected = p.slug === activeSlug;
                                const isNearest = p.slug === nearestEventSlug;
                                return (
                                    <PointItem key={p.slug}>
                                        <PointButton
                                            role="option"
                                            aria-selected={selected}
                                            aria-current={isNearest ? "true" : undefined}
                                            title={formatReadableDate(p.startDate, locale, timeZone)}
                                            onMouseEnter={() => onPointEnter(p.slug)}
                                            onFocus={() => onPointFocus(p.slug)}
                                            onBlur={onPointBlur}
                                            style={{ left: `${p.x}%` }}
                                            $color={p.color}
                                            data-id={p.slug}
                                        >
                                            <SrOnly>
                                                {new Intl.DateTimeFormat(locale, {
                                                    day: "2-digit",
                                                    month: "short",
                                                    timeZone
                                                }).format(p.startDate)}
                                                {`: ${p.title}${p.location ? " · " + p.location : ""}`}
                                            </SrOnly>
                                        </PointButton>
                                    </PointItem>
                                );
                            })}
                        </Points>
                    </Axis>

                    <Cursor aria-label={m["index.events.youAreHere"]()} style={{ left: `${todayPercent}%` }}>
                        <CursorLabel>{m["index.events.youAreHere"]()}</CursorLabel>
                    </Cursor>

                    <SrOnly id="timeline__help">{m["index.events.timelineSR"]()}</SrOnly>
                </Timeline>
            </TimelinePadding>
        </Section>
    );
}
