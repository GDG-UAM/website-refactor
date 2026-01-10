export type CarouselElementType = "container" | "text" | "qr" | "image" | "spacer";

export interface CarouselElement {
    id: string;
    type: CarouselElementType;
    props: {
        content?: string | null;
        variant?: "h1" | "h2" | "h3" | "body" | null;
        color?: string | null;
        align?: "left" | "center" | "right" | null;
        fontSize?: string | null;
        fontWeight?: string | null;
        direction?: "row" | "column" | null;
        gap?: number | null;
        alignItems?: "flex-start" | "center" | "flex-end" | "stretch" | null;
        justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | null;
        flex?: number | null;
        padding?: string | null;
        value?: string | null;
        size?: number | null;
        cornerSize?: number | null;
        cornerColor?: string | null;
        logoUrl?: string | null;
        logoSize?: number | null;
        url?: string | null;
        alt?: string | null;
        height?: string | null;
        width?: string | null;
        objectFit?: "contain" | "cover" | null;
        grow?: number | null;
        heightPx?: number | null;
        widthPx?: number | null;
    };
    children?: CarouselElement[] | null;
}

export interface CarouselSlide {
    id: string;
    duration: number;
    hidden?: boolean;
    root: CarouselElement;
    label?: string | null;
}

export interface ScheduleEntry {
    startTime: string;
    endTime?: string | null;
    title: string;
}

export interface SponsorEntry {
    name: string;
    logoUrl: string;
    tier: number;
}

export interface IntermissionData {
    organizerLogoUrl?: string | null;
    schedule: ScheduleEntry[];
    carousel: CarouselSlide[];
    sponsors: SponsorEntry[];
}
