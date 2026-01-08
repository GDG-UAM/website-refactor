"use client";

import React from "react";
import { renderMarkdown } from "#/lib/markdown";
import UserMention from "#/components/markdown/components/UserMention";
import AudioVisualizer from "#/components/markdown/components/AudioPlayerVisualizer";
import IframeEmbed from "#/components/markdown/components/IframeEmbed";
import MarkdownImage from "#/components/markdown/components/MarkdownImage";
import { OpenLinkButton } from "#/components/Buttons";
import parse, { type DOMNode, type Element } from "html-react-parser";
import { Wrapper } from "./RenderMarkdown.styles";
import * as m from "#/paraglide/messages";

type RenderMarkdownProps = {
    markdown?: string;
    html?: string;
    className?: string;
    style?: React.CSSProperties;
};

export function RenderMarkdown({ markdown, html, className, style }: RenderMarkdownProps) {
    const [resolvedHtml, setResolvedHtml] = React.useState<string>(html || "");
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Resolve markdown -> sanitized HTML
    React.useEffect(() => {
        let cancelled = false;
        (async () => {
            if (html !== undefined && html !== null) {
                if (!cancelled) setResolvedHtml(String(html));
                return;
            }
            if (typeof markdown === "string") {
                try {
                    const res = await renderMarkdown(markdown);
                    if (!cancelled) setResolvedHtml(res.html);
                } catch {
                    if (!cancelled) setResolvedHtml("");
                }
            } else {
                if (!cancelled) setResolvedHtml("");
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [markdown, html]);

    // Parse sanitized HTML into React and replace <usermention> with <UserMention/>
    const reactTree = React.useMemo(() => {
        if (!resolvedHtml) return null;
        const isTag = (node: DOMNode): node is Element => {
            return (node as Element).type === "tag";
        };
        return parse(resolvedHtml, {
            replace(node) {
                if (isTag(node) && node.name === "usermention") {
                    const id = (node.attribs && node.attribs["data-id"]) || null;
                    return <UserMention userId={id} />;
                }
                if (isTag(node) && node.name === "audioplayer") {
                    const url = (node.attribs && node.attribs["data-url"]) || "";
                    const barsStr = (node.attribs && node.attribs["data-bars"]) || "100";
                    const mobileBarsStr = (node.attribs && node.attribs["data-bars-mobile"]) || "50";
                    const bars = parseInt(barsStr, 10) || 100;
                    const mobileBars = parseInt(mobileBarsStr, 10) || 50;
                    return <AudioVisualizer audioUrl={url} bars={bars} mobileBars={mobileBars} />;
                }
                if (isTag(node) && node.name === "seemorebutton") {
                    console.log("Rendering seemorebutton", node);
                    const href = (node.attribs && node.attribs["data-href"]) || "";
                    const text = (node.attribs && node.attribs["data-text"]) || m["markdown.components.seeMoreButton"]();
                    const label = (node.attribs && node.attribs["data-label"]) || m["markdown.components.seeMoreButton"]();
                    return (
                        <OpenLinkButton href={href} ariaLabel={label} slim color="default" disabled={!href} style={{ marginBottom: 16 }}>
                            {text}
                        </OpenLinkButton>
                    );
                }
                if (isTag(node) && node.name === "embedweb") {
                    const url = (node.attribs && node.attribs["data-url"]) || "";
                    const height = (node.attribs && node.attribs["data-height"]) || "450";
                    const title = (node.attribs && node.attribs["data-title"]) || undefined;
                    const showTitleBarStr = (node.attribs && node.attribs["data-show-title-bar"]) || "true";
                    const showTitleBar = showTitleBarStr !== "false";
                    return <IframeEmbed url={url} height={height} title={title} showTitleBar={showTitleBar} />;
                }
                if (isTag(node) && node.name === "mdimage") {
                    const src = (node.attribs && node.attribs["data-src"]) || "";
                    const alt = (node.attribs && node.attribs["data-alt"]) || "";
                    const title = (node.attribs && node.attribs["data-title"]) || undefined;
                    const blur = (node.attribs && node.attribs["data-blur"]) || undefined;
                    const widthStr = (node.attribs && node.attribs["data-width"]) || undefined;
                    const heightStr = (node.attribs && node.attribs["data-height"]) || undefined;
                    const width = widthStr ? parseInt(widthStr, 10) : undefined;
                    const height = heightStr ? parseInt(heightStr, 10) : undefined;
                    return <MarkdownImage src={src} alt={alt} title={title} blur={blur} width={width} height={height} />;
                }
                return undefined;
            }
        });
    }, [resolvedHtml]);

    return (
        <Wrapper ref={containerRef} className={className} style={style}>
            {reactTree}
        </Wrapper>
    );
}

export default RenderMarkdown;
