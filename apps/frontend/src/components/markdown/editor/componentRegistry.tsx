import React from "react";
import type { EmbedTag } from "#/lib/markdownSyntax";

/** An embeddable component. Easy to extend: add an entry here and a tokenizer in `lib/markdown.ts`. */
export type ComponentConfig = {
    id: Exclude<EmbedTag, "user">;
    label: string;
    /** Tint painted behind the tag in the editor. */
    color: string;
    /** False for tags that are only produced elsewhere (e.g. `mdimg`, written by the backend on save). */
    insertable: boolean;
    props: Array<{
        name: string;
        label: string;
        type: "text" | "number" | "boolean";
        required?: boolean;
        default?: string | number | boolean;
        placeHolderOnly?: boolean;
    }>;
    render: (props: Record<string, string>) => React.ReactNode;
};

const hostOf = (url: string | undefined, fallback: string) => {
    try {
        return new URL(url || "").hostname.replace(/^www\./, "");
    } catch {
        return url || fallback;
    }
};

export const COMPONENT_REGISTRY: ComponentConfig[] = [
    {
        id: "audioplayer",
        label: "Audio Player",
        color: "color-mix(in srgb, #6366f1 18%, transparent)",
        insertable: true,
        props: [
            { name: "url", label: "Audio URL", type: "text", required: true },
            { name: "bars", label: "Number of bars", type: "number", default: 100 },
            { name: "mobileBars", label: "Number of mobile bars", type: "number", default: 50 }
        ],
        render: (props) => (
            <span style={{ color: "#4338ca", fontWeight: 600 }}>
                🎵 Audio: {props.url?.split("/").pop() || "audio file"} ({props.bars || 100} bars, mobile: {props["bars-mobile"] || props.mobileBars || 50})
            </span>
        )
    },
    {
        id: "seemorebutton",
        label: "See More Button",
        color: "color-mix(in srgb, #ec4899 16%, transparent)",
        insertable: true,
        props: [
            { name: "href", label: "Redirect URL", type: "text", required: true },
            { name: "text", label: "Button Text", type: "text", default: '"See More" in this language', placeHolderOnly: true },
            { name: "label", label: "Aria Label", type: "text", default: "Use the default label for this language", placeHolderOnly: true }
        ],
        render: (props) => {
            let target = props.href || "Invalid URL";
            try {
                const url = new URL(props.href || "");
                target = url.pathname && url.pathname !== "/" ? `${url.hostname}/...` : url.hostname;
            } catch {}
            return (
                <span style={{ color: "#be185d", fontWeight: 600 }}>
                    🔗 {props.text || "Default text"}: {target} ({props.label || "Default aria label"})
                </span>
            );
        }
    },
    {
        id: "embedweb",
        label: "Embed Web",
        color: "color-mix(in srgb, var(--google-blue) 16%, transparent)",
        insertable: true,
        props: [
            { name: "url", label: "Website URL", type: "text", required: true },
            { name: "height", label: "Height (px)", type: "number", default: 450 },
            { name: "title", label: "Title Override", type: "text", default: "Auto-detect from URL", placeHolderOnly: true },
            { name: "showTitleBar", label: "Show Title Bar", type: "boolean", default: true }
        ],
        render: (props) => (
            <span style={{ color: "#1d4ed8", fontWeight: 600 }}>
                🌐 Embed: {hostOf(props.url, "invalid URL")} ({props.height || 450}px
                {props.showTitleBar === "false" ? ", no title bar" : ""})
            </span>
        )
    },
    {
        id: "mdimg",
        label: "Image",
        color: "color-mix(in srgb, var(--google-green) 16%, transparent)",
        insertable: false,
        props: [
            { name: "src", label: "Image URL", type: "text", required: true },
            { name: "alt", label: "Alt text", type: "text" }
        ],
        render: (props) => (
            <span style={{ color: "#15803d", fontWeight: 600 }}>
                🖼 {props.alt || decodeURIComponent(props.src?.split("/").pop() || "image")}
                {props.width && props.height ? ` (${props.width}×${props.height})` : ""}
            </span>
        )
    }
];

export const MENTION_COLOR = "color-mix(in srgb, #0ea5e9 16%, transparent)";

export const findComponent = (id: string) => COMPONENT_REGISTRY.find((c) => c.id === id);

export const embedColor = (tag: string) => (tag === "user" ? MENTION_COLOR : (findComponent(tag)?.color ?? "color-mix(in srgb, #a855f7 16%, transparent)"));
