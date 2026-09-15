import React, { useMemo } from "react";
import { highlightSource } from "#/lib/markdownSyntax";
import { HighlightLayer as Layer } from "../CustomMarkdownTextArea.styles";
import { embedColor } from "./componentRegistry";

/**
 * The second layout of the text, drawn behind the transparent textarea. Hidden from assistive
 * technology: every character is already in the textarea.
 *
 * Keyed on the text alone, so a caret move or a popup opening never re-parses the document. Embed
 * spans carry `data-embed-start` so `EmbedCovers` can find and measure them in one pass.
 */
export const HighlightLayer = React.memo(
    React.forwardRef<HTMLDivElement, { value: string; disabled?: boolean }>(function HighlightLayer({ value, disabled }, ref) {
        const spans = useMemo(() => highlightSource(value), [value]);

        return (
            <Layer ref={ref} aria-hidden $disabled={disabled}>
                {spans.map((span, index) => {
                    const className = [span.kind, span.heading && "heading", span.quoted && "quoted", span.struck && "struck"].filter(Boolean).join(" ");
                    if (span.embed) {
                        return (
                            <span key={index} className={className} data-embed-start={span.embed.start} style={{ background: embedColor(span.embed.tag) }}>
                                {span.text}
                            </span>
                        );
                    }
                    return (
                        <span key={index} className={className}>
                            {span.text}
                        </span>
                    );
                })}
                {/* A textarea shows a trailing newline as an empty last line; a div doesn't. */}
                {value.endsWith("\n") && <span>{"​"}</span>}
            </Layer>
        );
    })
);
