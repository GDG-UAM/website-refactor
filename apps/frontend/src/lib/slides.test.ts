import { describe, expect, it } from "bun:test";
import { deckPdfUrl, deckUrl, isDeckName } from "./slides";
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
