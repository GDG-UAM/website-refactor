/**
 * ← and → drive the most visible presentation on the page, without clicking into it first.
 *
 * A deck counts once at least VISIBLE of it is on screen (of its height, or of the screen's if the deck is taller).
 * Only ← and → are taken: ↑, ↓, Space and Page Up/Down keep scrolling the page. Nothing is taken while the reader is
 * typing, or while focus is already inside a deck (it handles its own keys then).
 *
 * The keys reach the deck as a postMessage, the same `{ type: "nav" }` its presenter window sends. The deck is
 * sandboxed (an opaque origin), so the target origin can only be "*"; the message carries nothing but a direction.
 */
const VISIBLE = 0.6;

type Entry = { el: HTMLElement; frame: HTMLIFrameElement; visible: number };

const entries = new Set<Entry>();
const listeners = new Set<() => void>();
let active: Entry | null = null;
let observer: IntersectionObserver | null = null;

function pickActive() {
    let best: Entry | null = null;
    for (const e of entries) if (e.visible >= VISIBLE && (!best || e.visible > best.visible)) best = e;
    if (best !== active) {
        active = best;
        listeners.forEach((l) => l());
    }
}

function isTyping(target: EventTarget | null) {
    const el = target as HTMLElement | null;
    return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}

/** One step forward (1) or back (-1) in a deck: what its presenter window sends. */
export function navigateDeck(frame: HTMLIFrameElement | null, dir: 1 | -1) {
    frame?.contentWindow?.postMessage({ type: "nav", dir }, "*");
}

function onKey(e: KeyboardEvent) {
    if (!active || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    if (isTyping(e.target) || document.activeElement instanceof HTMLIFrameElement) return;
    e.preventDefault();
    navigateDeck(active.frame, e.key === "ArrowRight" ? 1 : -1);
}

function onIntersect(records: IntersectionObserverEntry[]) {
    for (const r of records) {
        const entry = [...entries].find((e) => e.el === r.target);
        if (!entry) continue;
        const room = Math.min(r.boundingClientRect.height, r.rootBounds?.height ?? r.boundingClientRect.height);
        entry.visible = room > 0 ? r.intersectionRect.height / room : 0;
    }
    pickActive();
}

/** Start routing keys to this deck while it's visible. Returns the cleanup. */
export function registerDeck(el: HTMLElement, frame: HTMLIFrameElement) {
    const entry: Entry = { el, frame, visible: 0 };
    if (!observer) {
        observer = new IntersectionObserver(onIntersect, { threshold: Array.from({ length: 21 }, (_, i) => i / 20) });
        window.addEventListener("keydown", onKey);
    }
    entries.add(entry);
    observer.observe(el);
    return () => {
        entries.delete(entry);
        observer?.unobserve(el);
        if (!entries.size) {
            observer?.disconnect();
            observer = null;
            window.removeEventListener("keydown", onKey);
        }
        pickActive();
    };
}

/** For useSyncExternalStore: whether `el` is the deck the arrows drive right now. */
export const subscribeActive = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};
export const activeDeckElement = () => active?.el ?? null;
