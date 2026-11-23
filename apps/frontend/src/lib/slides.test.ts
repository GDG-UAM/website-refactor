import { afterEach, describe, expect, it } from "bun:test";
import { deckPdfUrl, deckUrl, getDeckInfo, isDeckName } from "./slides";
import { renderMarkdown } from "./markdown";
import { findEmbeds } from "./markdownSyntax";

describe("deck names", () => {
    it("accepts the presentations repo's folder names", () => {
        for (const name of ["github", "townhall-spotlight", "io-2026", "a1"]) expect(isDeckName(name)).toBe(true);
    });

    it("rejects anything that could point elsewhere", () => {
        for (const name of ["", "core", "GitHub", "-x", "x-", "a--b", "../x", "x/y", "x?y", "x#y", "https://evil.example", "//evil.example", "a b"]) {
            expect(isDeckName(name)).toBe(false);
        }
        expect(isDeckName(undefined)).toBe(false);
    });

    it("only builds slides.gdguam.es URLs", () => {
        expect(deckUrl("github")).toBe("https://slides.gdguam.es/github/");
        expect(deckUrl("github", { fullscreen: true })).toBe("https://slides.gdguam.es/github/?fullscreen");
        expect(deckPdfUrl("github")).toBe("https://slides.gdguam.es/github/slides.pdf");
        expect(deckPdfUrl("github", { download: true })).toBe("https://slides.gdguam.es/github/slides.pdf?download=1");
    });

    it("asks for the language by its 2-letter code", () => {
        expect(deckUrl("github", { lang: "en" })).toBe("https://slides.gdguam.es/github/?lang=en");
        expect(deckUrl("github", { fullscreen: true, lang: "es" })).toBe("https://slides.gdguam.es/github/?fullscreen&lang=es");
        expect(deckPdfUrl("github", { lang: "es" })).toBe("https://slides.gdguam.es/github/slides.pdf?lang=es");
        expect(deckPdfUrl("github", { download: true, lang: "en-GB" })).toBe("https://slides.gdguam.es/github/slides.pdf?download=1&lang=en");
        expect(deckUrl("github", { lang: "x&y" })).toBe("https://slides.gdguam.es/github/");
    });
});

describe("<slides /> in markdown", () => {
    it("renders to a sanitized placeholder carrying only the deck name", async () => {
        const { html } = await renderMarkdown('Intro\n\n<slides deck="github" />\n\nAfter');
        expect(html).toContain('<slides data-deck="github"></slides>');
        expect(html).toContain("After");
    });

    it("drops anything but the deck name", async () => {
        const { html } = await renderMarkdown('<slides deck="github" src="https://evil.example" onload="alert(1)" />');
        expect(html).toContain('<slides data-deck="github"></slides>');
        expect(html).not.toContain("evil");
        expect(html).not.toContain("onload");
    });

    it("escapes the deck attribute", async () => {
        const { html } = await renderMarkdown("<slides deck='x\"><script>alert(1)</script>' />");
        expect(html).not.toContain("<script");
    });

    it("is an embed the editor knows", () => {
        const [embed] = findEmbeds('text <slides deck="townhall-spotlight" /> text');
        expect(embed.tag).toBe("slides");
        expect(embed.attrs.deck).toBe("townhall-spotlight");
    });
});

describe("<div style> in markdown", () => {
    it("keeps whitelisted layout styles and drops the rest", async () => {
        const { html } = await renderMarkdown(
            '<div style="display: flex; gap: 20px; max-width: 400px; margin: 0 auto; position: fixed; background: url(https://evil.example)">\n\nhi\n\n</div>'
        );
        expect(html).toContain('style="display:flex;gap:20px;max-width:400px;margin:0 auto"');
        expect(html).not.toContain("fixed");
        expect(html).not.toContain("evil");
    });

    it("accepts calc and color functions but no other function", async () => {
        const { html } = await renderMarkdown(
            '<div style="max-width: calc(100% - 2rem); color: rgb(10 20 30 / 50%); background-color: hsla(0, 0%, 0%, .1); border-color: url(x); margin: var(--x)">\n\nhi\n\n</div>'
        );
        expect(html).toContain("max-width:calc(100% - 2rem)");
        expect(html).toContain("color:rgb(10 20 30 / 50%)");
        expect(html).toContain("background-color:hsla(0, 0%, 0%, .1)");
        expect(html).not.toContain("url(");
        expect(html).not.toContain("var(");
    });
});

describe("deck info", () => {
    const realFetch = globalThis.fetch;
    afterEach(() => {
        globalThis.fetch = realFetch;
    });

    it("reads decks.json in the requested language, once per language", async () => {
        const urls: string[] = [];
        globalThis.fetch = (async (url: string) => {
            urls.push(url);
            const lang = new URL(url).searchParams.get("lang") ?? "es";
            return Response.json({ version: 1, decks: { github: { title: `t-${lang}`, description: "", lang, pdf: { bytes: 1 } } } });
        }) as unknown as typeof fetch;

        expect((await getDeckInfo("github", "en-GB"))?.title).toBe("t-en");
        expect((await getDeckInfo("github", "en"))?.title).toBe("t-en");
        expect((await getDeckInfo("github", "es"))?.lang).toBe("es");
        expect(await getDeckInfo("missing", "en")).toBeUndefined();
        expect(urls).toEqual(["https://slides.gdguam.es/decks.json?lang=en", "https://slides.gdguam.es/decks.json?lang=es"]);
    });
});
