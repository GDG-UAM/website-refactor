import { describe, expect, it } from "bun:test";
import { buildEmbedTag, detectTrigger, findEmbeds, highlightSource, protectEmbeds, type HighlightKind, type HighlightSpan } from "./markdownSyntax";
import { renderMarkdown } from "./markdown";

/* The editor's highlight layer is a second copy of the field, laid out under a transparent textarea.
 * A span list that doesn't reassemble into the input is a highlight that has slid off the text. */

const rebuild = (spans: HighlightSpan[]) => spans.map((span) => span.text).join("");
const textOf = (spans: HighlightSpan[], kind: HighlightKind) => spans.filter((span) => span.kind === kind).map((span) => span.text);

const USER = '<user data-id="68a1f2c3d4e5f60718293a4b" />';
const MDIMG = '<mdimg src="https://cdn.example.com/a.webp" alt="A photo" blur="LEHV6nWB2yk8pyo0adR*.7kCMdnj" width="1200" height="800">';

const MATH = String.raw`- \(\lambda = 0.33\): penalización por cada respuesta incorrecta.
- \(p = 2\): la precisión por clase se eleva al cuadrado.

El factor de velocidad se expresa como \(n_k^\alpha\), y $a_1$ cuesta $5 y $10.

\[
\boxed{
\text{Score} =
\left(\prod_{k=0}^{7} T_k\right)^{1/8}
}
\]

$$
x^2
$$`;

const SAMPLES = [
    MATH,
    "$$\nunclosed display\n",
    "| $a|b$ | c |",
    "",
    "\n",
    "\n\n\n",
    "Just a sentence.",
    "# A heading with **bold** in it",
    "###### Six levels",
    "#not a heading",
    "> Something quoted, with **weight**.",
    "> > nested quote",
    "> - a bullet inside a quote",
    "- one\n- two\n- three",
    "1. first\n2) second",
    "- [ ] unticked\n- [x] ticked\n- [X] also ticked",
    "---",
    "   ***   ",
    "Some `code with **stars**` inline.",
    "```\nconst x = 1;\n**not bold**\n```",
    "```ts\nunclosed fence\n",
    "~~~\ntilde fence\n~~~",
    "A [link](https://example.com) and an ![image](https://example.com/a.png).",
    "Bare https://example.com/path?x=1 url.",
    "~~strike~~, ~sub~, ^sup^ and ==mark==.",
    "snake_case_name stays prose, _this_ does not.",
    "A footnote[^1].\n\n[^1]: The note.",
    ":::warning Heads up\nBody with *emphasis*.\n:::",
    "| a | b |\n|---|:-:|\n| 1 | **2** |",
    `Hi ${USER}, see ${MDIMG}`,
    `${USER}${USER}`,
    '<user data-id="x"></user> paired',
    "A stray < and a <div> tag.",
    "Emoji 🌱 and accents café.",
    "Trailing spaces   \nand a tab\tinside."
];

describe("highlightSource", () => {
    it.each(SAMPLES)("reassembles into exactly the source: %j", (source) => {
        expect(rebuild(highlightSource(source))).toBe(source);
    });

    it("never emits an empty span", () => {
        for (const source of SAMPLES) {
            expect(highlightSource(source).every((span) => span.text.length > 0)).toBe(true);
        }
    });

    it("merges prose into one span", () => {
        const prose = Array.from({ length: 40 }, (_, i) => `Line ${i} of ordinary prose.`).join("\n");
        expect(highlightSource(prose)).toHaveLength(1);
    });

    it("never descends into a code span", () => {
        const spans = highlightSource("Some `code with **stars**` inline.");
        expect(textOf(spans, "code")).toEqual(["code with **stars**"]);
        expect(textOf(spans, "strong")).toEqual([]);
    });

    it("paints every line of a fence as code, including separators", () => {
        const spans = highlightSource("```\nconst x = 1;\n**not bold**\n```\nafter");
        expect(textOf(spans, "code")).toEqual(["\nconst x = 1;\n**not bold**\n"]);
        expect(textOf(spans, "strong")).toEqual([]);
        expect(textOf(spans, "text")).toEqual(["\nafter"]);
    });

    it("marks heading words, not the hashes", () => {
        const spans = highlightSource("## Title **bold**");
        expect(spans[0]).toEqual({ text: "## ", kind: "syntax" });
        expect(spans.filter((s) => s.heading).map((s) => s.text)).toEqual(["Title ", "**", "bold", "**"]);
    });

    it("strikes ticked tasks but not the checkbox", () => {
        const spans = highlightSource("- [x] done");
        expect(spans.find((s) => s.text === "[x] ")?.struck).toBeUndefined();
        expect(spans.find((s) => s.text === "done")?.struck).toBe(true);
    });

    it("prefers strike over sub and strong over emphasis", () => {
        const spans = highlightSource("~~gone~~ **big**");
        expect(textOf(spans, "strike")).toEqual(["gone"]);
        expect(textOf(spans, "script")).toEqual([]);
        expect(textOf(spans, "strong")).toEqual(["big"]);
    });

    it("leaves intraword underscores alone", () => {
        expect(textOf(highlightSource("snake_case_name"), "emphasis")).toEqual([]);
    });

    it("emits embed spans at the same ranges findEmbeds reports", () => {
        const source = `Hi ${USER}, see ${MDIMG} and <user data-id="y"></user>`;
        const spans = highlightSource(source);
        const embeds = findEmbeds(source);
        expect(embeds.map((e) => e.tag)).toEqual(["user", "mdimg", "user"]);
        expect(spans.filter((s) => s.kind === "embed").map((s) => [s.embed!.start, s.embed!.start + s.text.length])).toEqual(
            embeds.map((e) => [e.start, e.end])
        );
    });

    it("keeps adjacent embeds apart", () => {
        expect(highlightSource(`${USER}${USER}`).filter((s) => s.kind === "embed")).toHaveLength(2);
    });

    it("dims table pipes", () => {
        const spans = highlightSource("| a | b |");
        expect(textOf(spans, "syntax")).toEqual(["|", "|", "|"]);
    });

    it("paints LaTeX in every delimiter, but not prices", () => {
        const spans = highlightSource(MATH);
        expect(textOf(spans, "math")).toEqual([
            String.raw`\lambda = 0.33`,
            "p = 2",
            String.raw`n_k^\alpha`,
            "a_1",
            String.raw`
\boxed{
\text{Score} =
\left(\prod_{k=0}^{7} T_k\right)^{1/8}
}
`,
            "\nx^2\n"
        ]);
        expect(textOf(spans, "script")).toEqual([]);
        expect(textOf(spans, "emphasis")).toEqual([]);
    });

    it("leaves an unclosed display block alone, as the renderer does", () => {
        expect(textOf(highlightSource("$$\nnot maths\n"), "math")).toEqual([]);
    });

    it("never reads maths inside code", () => {
        expect(textOf(highlightSource("`$x$`\n```\n$$\ny\n$$\n```"), "math")).toEqual([]);
    });
});

describe("LaTeX in rendered markdown", () => {
    const tex = (html: string) => [...html.matchAll(/<latex data-tex="([^"]*)"( data-display="true")?><\/latex>/g)].map((m) => [m[1], !!m[2]]);

    it("renders every delimiter to a placeholder, display or not", async () => {
        const { html } = await renderMarkdown(MATH);
        expect(tex(html)).toEqual([
            [String.raw`\lambda = 0.33`, false],
            ["p = 2", false],
            [String.raw`n_k^\alpha`, false],
            ["a_1", false],
            [
                String.raw`\boxed{
\text{Score} =
\left(\prod_{k=0}^{7} T_k\right)^{1/8}
}`,
                true
            ],
            ["x^2", true]
        ]);
        expect(html).toContain("cuesta $5 y $10.");
        expect(html).not.toContain("<p><latex");
    });

    it("lets a display block interrupt a paragraph, and keeps escaped dollars", async () => {
        const { html } = await renderMarkdown("La puntuación es:\n$$\na & b < c\n$$\n\\$1 y $$x$$ en línea");
        expect(html).toContain('<p>La puntuación es:</p>\n<latex data-tex="a &amp; b &lt; c" data-display="true"></latex>');
        expect(html).toContain('$1 y <latex data-tex="x" data-display="true"></latex> en línea');
    });
});

describe("findEmbeds", () => {
    it("parses attributes, including escaped quotes", () => {
        const [embed] = findEmbeds(buildEmbedTag("seemorebutton", { href: "https://x.y", text: 'Say "hi"', label: undefined }));
        expect(embed.tag).toBe("seemorebutton");
        expect(embed.attrs).toEqual({ href: "https://x.y", text: 'Say "hi"' });
    });

    it("reads the backend's mdimg tag", () => {
        const [embed] = findEmbeds(MDIMG);
        expect(embed.raw).toBe(MDIMG);
        expect(embed.attrs.width).toBe("1200");
    });
});

describe("protectEmbeds", () => {
    it("passes edits that don't touch an embed", () => {
        expect(protectEmbeds(`a ${USER} b`, `ab ${USER} b`)).toEqual({ value: `ab ${USER} b` });
    });

    it("removes the whole tag when one character of it is deleted", () => {
        const prev = `a ${USER} b`;
        const next = prev.slice(0, 2 + USER.length - 1) + prev.slice(2 + USER.length);
        expect(protectEmbeds(prev, next)).toEqual({ value: "a  b", caret: 2 });
    });

    it("keeps what was typed inside a tag, and drops the tag", () => {
        const prev = `a ${USER} b`;
        const next = prev.slice(0, 5) + "X" + prev.slice(5);
        expect(protectEmbeds(prev, next)).toEqual({ value: "a X b", caret: 3 });
    });
});

describe("detectTrigger", () => {
    const at = (text: string) => detectTrigger(text, text.length);

    it("opens at the start of a word", () => {
        expect(at("@")).toEqual({ kind: "mention", start: 0, query: "" });
        expect(at("hello @ana")).toEqual({ kind: "mention", start: 6, query: "ana" });
        expect(at("(@ana")).toEqual({ kind: "mention", start: 1, query: "ana" });
        expect(at("/")).toEqual({ kind: "component", start: 0, query: "" });
        expect(at("line\n/audio")).toEqual({ kind: "component", start: 5, query: "audio" });
    });

    it("stays closed mid-word and in URLs", () => {
        expect(at("mail a@b.com")).toBeNull();
        expect(at("https://x")).toBeNull();
        expect(at("see a/b")).toBeNull();
        expect(at("@ana ")).toBeNull();
    });
});
