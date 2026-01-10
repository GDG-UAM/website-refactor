"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { IntermissionData } from "#/components/pages/admin/hackathons/intermission/IntermissionForm.types";
import { api } from "#/lib/eden";
import * as m from "#/paraglide/messages";
import { CarouselRenderer } from "./CarouselRenderer";
import {
    GlobalIntermissionStyle,
    MobileMessage,
    Container,
    TopBar,
    OrganizerLogo,
    MainContent,
    ScheduleSection,
    ScheduleContainer,
    FadeOverlay,
    CarouselSection,
    CarouselItem,
    ScheduleTitle,
    ScheduleList,
    ScheduleItem,
    TimeTag,
    ActivityTitle,
    SponsorsSection,
    SponsorGrid,
    SponsorLogo
} from "./IntermissionPage.styles";

const SPONSOR_CONFIG = {
    gap: 30,
    multipliers: {
        3: 1.75, // Platinum
        2: 1.325, // Gold
        1: 1.0 // Silver
    } as Record<number, number>,
    marginHorizontal: 80 // 40px each side
};

export default function IntermissionPage({ slug, initialData }: { slug: string; initialData: IntermissionData }) {
    const [data, setData] = useState<IntermissionData>(initialData);
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [dataVersion, setDataVersion] = useState(0);
    const [baseSponsorHeight, setBaseSponsorHeight] = useState(60);
    const [aspectRatios, setAspectRatios] = useState<Record<number, number>>({});
    const [showTopFade, setShowTopFade] = useState(false);
    const [showBottomFade, setShowBottomFade] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    const scheduleListRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const checkMobile = () => {
            // Mobile if width is less than 1024px or screen is taller than it is wide
            setIsMobile(window.innerWidth < 1024 || window.innerHeight > window.innerWidth);
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const handleScroll = () => {
        if (!scheduleListRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scheduleListRef.current;
        setShowTopFade(scrollTop > 10);
        setShowBottomFade(scrollTop + clientHeight < scrollHeight - 10);
    };

    const isCurrentActivity = useCallback(
        (index: number) => {
            if (!data?.schedule) return false;
            const item = data.schedule[index];
            const nextItem = data.schedule[index + 1];

            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            const [startH, startM] = item.startTime.split(":").map(Number);
            const startMinutes = startH * 60 + startM;

            if (item.endTime) {
                const [endH, endM] = item.endTime.split(":").map(Number);
                const endMinutes = endH * 60 + endM;
                return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
            } else if (nextItem) {
                const [nextH, nextM] = nextItem.startTime.split(":").map(Number);
                const nextStartMinutes = nextH * 60 + nextM;
                // If next item happens "earlier" (midnight crossing), treat it as next day (add 24h) if we wanted to support it,
                // but for now we stick to simple comparison as per "PC Time" request which implies linear day time.
                return currentMinutes >= startMinutes && currentMinutes < nextStartMinutes;
            }

            return currentMinutes >= startMinutes;
        },
        [data]
    );

    useEffect(() => {
        const ws = api.hackathons({ slug }).intermission.ws.subscribe();

        ws.on("message", (event: { data: unknown }) => {
            const updatedData = event.data as Partial<IntermissionData>;
            if (updatedData.carousel) {
                updatedData.carousel = updatedData.carousel.map((slide) => ({
                    ...slide,
                    duration: slide.hidden ? 0 : slide.duration
                }));
            }
            setData((prev) => ({ ...prev, ...updatedData }));
            setCarouselIndex(0);
            setDataVersion((v) => v + 1);
        });

        return () => {
            ws.close();
        };
    }, [slug]);

    const [activeIndex, setActiveIndex] = useState(-1);

    // Update active index
    useEffect(() => {
        const updateActiveIndex = () => {
            const newIndex = data.schedule.findIndex((_, i) => isCurrentActivity(i));
            setActiveIndex(newIndex);
        };

        updateActiveIndex();
        const interval = setInterval(updateActiveIndex, 1000); // Check every second for precision
        return () => clearInterval(interval);
    }, [data.schedule, isCurrentActivity]);

    // Handle auto-scroll to active item
    useEffect(() => {
        const performScroll = () => {
            if (activeIndex !== -1 && scheduleListRef.current) {
                const activeElement = itemRefs.current[activeIndex];
                if (activeElement) {
                    const container = scheduleListRef.current;
                    const containerHeight = container.offsetHeight;
                    const elementOffset = activeElement.offsetTop;

                    // Position the item a little higher than the center (at 35% of the container)
                    const targetScroll = elementOffset - containerHeight * 0.35;
                    container.scrollTo({ top: targetScroll, behavior: "smooth" });
                }
            }
        };

        performScroll(); // Initial scroll and on index change
        const scrollInterval = setInterval(performScroll, 5000); // Periodically keep centered

        return () => clearInterval(scrollInterval);
    }, [activeIndex]);

    useEffect(() => {
        const loadAspectRatios = async () => {
            const ratios: Record<number, number> = {};
            const promises = (data.sponsors || []).map((s, i) => {
                return new Promise<void>((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        ratios[i] = img.naturalWidth / img.naturalHeight;
                        resolve();
                    };
                    img.onerror = () => {
                        ratios[i] = 2; // Default fallback for unknown aspect ratio (2:1 as a safe bet)
                        resolve();
                    };
                    img.src = s.logoUrl;
                });
            });

            await Promise.all(promises);
            setAspectRatios(ratios);
        };

        loadAspectRatios();
    }, [data.sponsors]);

    useEffect(() => {
        const calculateBaseHeight = () => {
            const sponsors = data.sponsors || [];
            if (sponsors.length === 0) return;

            const availableWidth = window.innerWidth - SPONSOR_CONFIG.marginHorizontal;
            const totalGaps = SPONSOR_CONFIG.gap * (sponsors.length - 1);

            // Calculate the sum of (multiplier * aspect_ratio) for each sponsor
            const sumWeightedRatios = sponsors.reduce((acc, s, i) => {
                const multiplier = SPONSOR_CONFIG.multipliers[s.tier] || 1;
                const ratio = aspectRatios[i] || 2; // Use loaded ratio or fallback
                return acc + multiplier * ratio;
            }, 0);

            const calculatedHeight = (availableWidth - totalGaps) / sumWeightedRatios;

            setBaseSponsorHeight(calculatedHeight);
        };

        calculateBaseHeight();
        window.addEventListener("resize", calculateBaseHeight);
        return () => window.removeEventListener("resize", calculateBaseHeight);
    }, [data.sponsors, aspectRatios]);

    const filteredCarousel = (data.carousel || []).filter((item) => item.duration !== 0);

    useEffect(() => {
        if (filteredCarousel.length === 0) return;

        const actualIndex = carouselIndex % filteredCarousel.length;
        const current = filteredCarousel[actualIndex];

        const timer = setTimeout(
            () => {
                setCarouselIndex((prev) => (prev + 1) % filteredCarousel.length);
            },
            (current.duration || 30) * 1000
        );

        return () => clearTimeout(timer);
    }, [carouselIndex, filteredCarousel]);

    const isPastActivity = (index: number) => {
        // Optimization: If a verified active item exists, anything before it is past.
        if (activeIndex !== -1) {
            return index < activeIndex;
        }

        // Fallback: Check times manually (for gaps where no item is active)
        if (!data?.schedule) return false;
        const item = data.schedule[index];
        const nextItem = data.schedule[index + 1];

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        // Determine the effective point where this item is "over"
        let endMinutes = -1;

        if (item.endTime) {
            const [h, m] = item.endTime.split(":").map(Number);
            endMinutes = h * 60 + m;
        } else if (nextItem) {
            // If no explicit end time, implicit end is the start of the next item
            const [h, m] = nextItem.startTime.split(":").map(Number);
            endMinutes = h * 60 + m;
        } else {
            // Last item with no end time never becomes "past"
            return false;
        }

        return currentMinutes > endMinutes;
    };

    // Balanced sorting: tiered best in the middle
    const getBalancedSponsors = () => {
        const items = [...data.sponsors].sort((a, b) => b.tier - a.tier);
        const balanced: typeof items = [];
        items.forEach((item, i) => {
            if (i % 2 === 0) balanced.push(item);
            else balanced.unshift(item);
        });
        return balanced;
    };

    return (
        <>
            <GlobalIntermissionStyle />
            {isMobile ? (
                <MobileMessage>
                    <h1>{m["hackathon.intermission.mobile.title"]()}</h1>
                    <p>{m["hackathon.intermission.mobile.description"]()}</p>
                </MobileMessage>
            ) : (
                <Container>
                    <TopBar>{data.organizerLogoUrl && <OrganizerLogo src={data.organizerLogoUrl} alt="Organizer" />}</TopBar>

                    <MainContent>
                        <ScheduleSection>
                            <ScheduleTitle>{m["hackathon.intermission.scheduleTitle"]()}</ScheduleTitle>
                            <ScheduleContainer>
                                <FadeOverlay $position="top" $visible={showTopFade} />
                                <ScheduleList ref={scheduleListRef} onScroll={handleScroll}>
                                    {data.schedule.map((item, i) => {
                                        const active = i === activeIndex;
                                        const past = isPastActivity(i);
                                        return (
                                            <ScheduleItem
                                                key={i}
                                                $active={active}
                                                $past={past}
                                                ref={(el) => {
                                                    itemRefs.current[i] = el;
                                                }}
                                            >
                                                <TimeTag $active={active} $past={past}>
                                                    {item.startTime}
                                                    {item.endTime ? ` - ${item.endTime}` : "+"}
                                                </TimeTag>
                                                <ActivityTitle $active={active} $past={past}>
                                                    {item.title}
                                                </ActivityTitle>
                                            </ScheduleItem>
                                        );
                                    })}
                                </ScheduleList>
                                <FadeOverlay $position="bottom" $visible={showBottomFade} />
                            </ScheduleContainer>
                        </ScheduleSection>

                        <CarouselSection>
                            <AnimatePresence mode="wait">
                                {filteredCarousel.length > 0 && (
                                    <CarouselItem
                                        key={`${filteredCarousel[carouselIndex % filteredCarousel.length].id}-${dataVersion}`}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.05 }}
                                        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                                    >
                                        <CarouselRenderer element={filteredCarousel[carouselIndex % filteredCarousel.length].root} />
                                    </CarouselItem>
                                )}
                            </AnimatePresence>
                        </CarouselSection>
                    </MainContent>

                    <SponsorsSection>
                        <SponsorGrid $gap={SPONSOR_CONFIG.gap}>
                            {getBalancedSponsors().map((s, i) => (
                                <SponsorLogo key={i} src={s.logoUrl} alt={s.name} $height={baseSponsorHeight * (SPONSOR_CONFIG.multipliers[s.tier] || 1)} />
                            ))}
                        </SponsorGrid>
                    </SponsorsSection>
                </Container>
            )}
        </>
    );
}
