/**
 * Presentations published at slides.gdguam.es (the GDG-UAM/presentations repo). Blog posts embed them by name only,
 * so no other site can be embedded this way.
 */
export const SLIDES_ORIGIN = "https://slides.gdguam.es";

/** A deck's folder name in the presentations repo, which is also its URL path. */
export const isDeckName = (name: string | undefined): name is string => !!name && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) && name !== "core";

/** The deck itself. `?fullscreen` shows its full-screen button (bottom right). */
export const deckUrl = (name: string, { fullscreen = false } = {}) => `${SLIDES_ORIGIN}/${name}/${fullscreen ? "?fullscreen" : ""}`;

/** Every deck's PDF has this path. `download` saves it (as gdguam-<name>.pdf) instead of opening it. */
export const deckPdfUrl = (name: string, { download = false } = {}) => `${SLIDES_ORIGIN}/${name}/slides.pdf${download ? "?download=1" : ""}`;

/**
 * Sandbox for the embed: no `allow-same-origin`, so the deck gets an opaque origin. It can't read this site's cookies
 * or storage, and its requests to gdguam.es are cross-site, so they carry none. Links in slides open in new tabs,
 * outside the sandbox.
 */
export const DECK_SANDBOX = "allow-scripts allow-popups allow-popups-to-escape-sandbox allow-downloads";

export type DeckInfo = {
    title: string;
    description: string;
    lang: string;
    pdf: { bytes: number };
};

type Manifest = { decks: Record<string, DeckInfo> };

let manifest: Promise<Manifest | null> | null = null;

/** What slides.gdguam.es/decks.json says about a deck: undefined if it isn't published, null if the list can't be read. */
export async function getDeckInfo(name: string): Promise<DeckInfo | undefined | null> {
    manifest ??= fetch(`${SLIDES_ORIGIN}/decks.json`, { credentials: "omit" })
        .then((r) => (r.ok ? (r.json() as Promise<Manifest>) : null))
        .catch(() => null);
    const list = await manifest;
    if (!list) {
        manifest = null; // try again next time
        return null;
    }
    return Object.prototype.hasOwnProperty.call(list.decks, name) ? list.decks[name] : undefined;
}
