"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronLeftButton, ChevronRightButton, DownloadButton } from "#/components/Buttons";
import { DECK_SANDBOX, deckPdfUrl, deckUrl, getDeckInfo, isDeckName, type DeckInfo } from "#/lib/slides";
import * as m from "#/paraglide/messages";
import { activeDeckElement, navigateDeck, registerDeck, subscribeActive } from "./slidesKeys";
import { Actions, Caption, Container, Frame, Notice, Title } from "./SlidesEmbed.styles";

const megabytes = (bytes: number) => `${(bytes / 1048576).toFixed(1)} MB`;

type Edges = { first: boolean; last: boolean };
const isEdges = (d: unknown): d is Edges & { type: "deck-state" } =>
    !!d &&
    typeof d === "object" &&
    (d as { type?: unknown }).type === "deck-state" &&
    typeof (d as Edges).first === "boolean" &&
    typeof (d as Edges).last === "boolean";

/** A presentation from slides.gdguam.es, by name, with its title, prev/next and PDF underneath. ← → drive it while it's in view. */
export default function SlidesEmbed({ deck }: { deck: string }) {
    // undefined: not published; null: decks.json couldn't be read (the deck may still load, so it's shown anyway)
    const [info, setInfo] = useState<DeckInfo | undefined | null>(null);
    const [checked, setChecked] = useState(false);
    const valid = isDeckName(deck);
    const container = useRef<HTMLElement>(null);
    const frame = useRef<HTMLIFrameElement>(null);
    // where the deck is (it reports every step): prev/next are disabled at either end
    const [edges, setEdges] = useState<Edges>({ first: true, last: false });
    // ← → only matter with a keyboard: there, prev/next turn primary while they'd drive this deck
    const [keyboard, setKeyboard] = useState(false);
    const active = useSyncExternalStore(
        subscribeActive,
        () => !!container.current && activeDeckElement() === container.current,
        () => false
    );

    useEffect(() => {
        if (!valid) return;
        let cancelled = false;
        setChecked(false);
        getDeckInfo(deck).then((result) => {
            if (cancelled) return;
            setInfo(result);
            setChecked(true);
        });
        return () => {
            cancelled = true;
        };
    }, [deck, valid]);

    const shown = valid && !(checked && info === undefined);
    useEffect(() => {
        if (!shown || !container.current || !frame.current) return;
        return registerDeck(container.current, frame.current);
    }, [shown]);

    useEffect(() => {
        if (!shown) return;
        const onMessage = (e: MessageEvent) => {
            // the deck is sandboxed (origin "null"), so it's recognised by its window, and only its position is read
            if (e.source !== frame.current?.contentWindow || !isEdges(e.data)) return;
            setEdges({ first: e.data.first, last: e.data.last });
        };
        window.addEventListener("message", onMessage);
        return () => window.removeEventListener("message", onMessage);
    }, [shown]);

    useEffect(() => setKeyboard(window.matchMedia("(hover: hover) and (pointer: fine)").matches), []);

    if (!valid) return <Notice>{m["markdown.components.slides.invalid"]()}</Notice>;
    if (!shown) return <Notice>{m["markdown.components.slides.notFound"]({ name: deck })}</Notice>;

    const title = info?.title || deck;
    const size = info ? megabytes(info.pdf.bytes) : null;
    const nav = active && keyboard ? "primary" : "default";

    return (
        <Container ref={container}>
            <Frame $active={active}>
                <iframe
                    ref={frame}
                    src={deckUrl(deck, { fullscreen: true })}
                    title={m["markdown.components.slides.frameTitle"]({ title })}
                    sandbox={DECK_SANDBOX}
                    allow="fullscreen"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    // it reports on every step anyway; this covers a report sent before the page listened
                    onLoad={() => frame.current?.contentWindow?.postMessage({ type: "deck-state?" }, "*")}
                />
            </Frame>
            <Caption>
                <Title title={info?.description || title}>{title}</Title>
                <Actions>
                    <ChevronLeftButton
                        ariaLabel={m["markdown.components.slides.previous"]()}
                        color={nav}
                        iconSize={20}
                        slim
                        disabled={edges.first}
                        onClick={() => navigateDeck(frame.current, -1)}
                    />
                    <ChevronRightButton
                        ariaLabel={m["markdown.components.slides.next"]()}
                        color={nav}
                        iconSize={20}
                        slim
                        disabled={edges.last}
                        onClick={() => navigateDeck(frame.current, 1)}
                    />
                    <DownloadButton
                        ariaLabel={size ? m["markdown.components.slides.downloadSize"]({ size }) : m["markdown.components.slides.download"]()}
                        color="default"
                        iconSize={20}
                        slim
                        onClick={() => {
                            // served as an attachment, so the browser saves it and the page stays
                            window.location.href = deckPdfUrl(deck, { download: true });
                        }}
                    >
                        PDF{size && ` · ${size}`}
                    </DownloadButton>
                </Actions>
            </Caption>
        </Container>
    );
}
