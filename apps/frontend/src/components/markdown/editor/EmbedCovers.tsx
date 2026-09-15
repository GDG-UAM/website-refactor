import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import type { Embed } from "#/lib/markdownSyntax";
import { EmbedCover, EmbedLabel } from "../CustomMarkdownTextArea.styles";

type Box = { left: number; top: number; width: number; height: number };

/**
 * Labels and click targets for every embed, drawn over the textarea.
 *
 * The tint behind each tag is pure CSS in the highlight layer (`box-decoration-break: clone`), so it
 * follows wrapped lines with no measuring at all. Only the label needs a position: it goes in the
 * widest line fragment of its tag. All embeds are measured in one pass — synchronously after a text
 * change, so labels never lag the text by a frame, and once per frame on resize or font load.
 */
export function EmbedCovers({
    layerRef,
    embeds,
    value,
    disabled,
    renderLabel,
    onEmbedClick
}: {
    layerRef: React.RefObject<HTMLDivElement | null>;
    embeds: Embed[];
    value: string;
    disabled?: boolean;
    renderLabel: (embed: Embed) => React.ReactNode;
    onEmbedClick: (embed: Embed) => void;
}) {
    const [boxes, setBoxes] = useState<Map<number, Box[]>>(new Map());

    const measure = useCallback(() => {
        const layer = layerRef.current;
        if (!layer) return;
        const base = layer.getBoundingClientRect();
        const next = new Map<number, Box[]>();
        layer.querySelectorAll<HTMLElement>("[data-embed-start]").forEach((el) => {
            const rects = Array.from(el.getClientRects()).filter((r) => r.width > 0);
            next.set(
                Number(el.dataset.embedStart),
                rects.map((r) => ({ left: r.left - base.left, top: r.top - base.top, width: r.width, height: r.height }))
            );
        });
        setBoxes(next);
    }, [layerRef]);

    useLayoutEffect(measure, [measure, value]);

    useEffect(() => {
        const layer = layerRef.current;
        if (!layer) return;
        let frame = 0;
        const schedule = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(measure);
        };
        const observer = new ResizeObserver(schedule);
        observer.observe(layer);
        document.fonts?.ready.then(schedule).catch(() => {});
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
        };
    }, [layerRef, measure]);

    return (
        <>
            {embeds.map((embed, index) => {
                const fragments = boxes.get(embed.start);
                if (!fragments?.length) return null;
                const widest = fragments.reduce((best, box) => (box.width > best.width ? box : best), fragments[0]);
                return fragments.map((box, i) => (
                    <EmbedCover
                        // By position in the list rather than offset, so typing before an embed doesn't remount its label.
                        key={`${embed.tag}-${index}-${i}`}
                        $clickable={!disabled}
                        style={box}
                        title={disabled ? undefined : "Click to edit"}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => !disabled && onEmbedClick(embed)}
                    >
                        {box === widest && <EmbedLabel>{renderLabel(embed)}</EmbedLabel>}
                    </EmbedCover>
                ));
            })}
        </>
    );
}
