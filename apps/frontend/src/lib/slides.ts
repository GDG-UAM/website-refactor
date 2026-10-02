/**
 * Presentations published at slides.gdguam.es (the GDG-UAM/presentations repo). Blog posts embed them by name only,
 * so no other site can be embedded this way.
 */
export const SLIDES_ORIGIN = "https://slides.gdguam.es";

/** A deck's folder name in the presentations repo, which is also its URL path. */
export const isDeckName = (name: string | undefined): name is string => !!name && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) && name !== "core";

/** A language's 2-letter code, or "" if it doesn't have one. slides.gdguam.es handles the fallbacks. */
const langCode = (lang?: string) => {
    const code = lang?.split("-")[0].toLowerCase();
    return code && /^[a-z]{2}$/.test(code) ? code : "";
};

/** A query string from bare flags plus `lang`, as its 2-letter code. */
const query = (flags: string[], lang?: string) => {
    const code = langCode(lang);
    if (code) flags = [...flags, `lang=${code}`];
    return flags.length ? `?${flags.join("&")}` : "";
};

/** The deck itself. `?fullscreen` shows its full-screen button (bottom right). */
export const deckUrl = (name: string, { fullscreen = false, lang }: { fullscreen?: boolean; lang?: string } = {}) =>
    `${SLIDES_ORIGIN}/${name}/${query(fullscreen ? ["fullscreen"] : [], lang)}`;

/**
 * Every deck's PDF has this path, with `lang` picking the translation. `download` saves it instead of opening it: as
 * gdguam-<name>-<lang>.pdf when translated, or gdguam-<name>.pdf in the deck's own language.
 */
export const deckPdfUrl = (name: string, { download = false, lang }: { download?: boolean; lang?: string } = {}) =>
    `${SLIDES_ORIGIN}/${name}/slides.pdf${query(download ? ["download=1"] : [], lang)}`;

/**
 * Sandbox for the embed: no `allow-same-origin`, so the deck gets an opaque origin. It can't read this site's cookies
 * or storage, and its requests to gdguam.es are cross-site, so they carry none. Links in slides open in new tabs,
 * outside the sandbox. `allow-orientation-lock` lets full screen turn a phone's deck to landscape.
 */
export const DECK_SANDBOX = "allow-scripts allow-popups allow-popups-to-escape-sandbox allow-downloads allow-orientation-lock";

export type DeckInfo = {
    title: string;
    description: string;
    lang: string;
    pdf: { bytes: number };
};

type Manifest = { decks: Record<string, DeckInfo> };

// one list per language code ("" for each deck's own language)
const manifests = new Map<string, Promise<Manifest | null>>();

/**
 * What slides.gdguam.es/decks.json says about a deck, in `lang` (the same one given to deckUrl/deckPdfUrl, so the
 * title, description and PDF size match the embed): undefined if it isn't published, null if the list can't be read.
 */
export async function getDeckInfo(name: string, lang?: string): Promise<DeckInfo | undefined | null> {
    const code = langCode(lang);
    let manifest = manifests.get(code);
    if (!manifest) {
        manifest = fetch(`${SLIDES_ORIGIN}/decks.json${query([], code)}`, { credentials: "omit" })
            .then((r) => (r.ok ? (r.json() as Promise<Manifest>) : null))
            .catch(() => null);
        manifests.set(code, manifest);
    }
    const list = await manifest;
    if (!list) {
        manifests.delete(code); // try again next time
        return null;
    }
    return Object.prototype.hasOwnProperty.call(list.decks, name) ? list.decks[name] : undefined;
}
