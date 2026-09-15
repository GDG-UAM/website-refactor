/**
 * What GDG markdown *is*, as spans over the raw source.
 *
 * Two surfaces read a markdown field: the renderer (`lib/markdown.ts`, marked + extensions) and the
 * editor (`components/markdown/CustomMarkdownTextArea.tsx`), which paints a highlight layer behind a
 * transparent textarea. The editor needs a flat list of pieces whose text concatenates back to the
 * input exactly, so that every highlighted glyph sits under the real caret. That invariant is the
 * contract of `highlightSource` and the first thing its tests check.
 *
 * The inline patterns for our marked extensions (sub, sup, mark, footnotes, embed tags) live here and
 * are imported by `lib/markdown.ts`, so the editor and the renderer agree on where a token starts.
 *
 * Nothing here touches React or the DOM.
 */

/* ----------------------------------------------------------------------------------------------- */
/* Shared grammar                                                                                  */
/* ----------------------------------------------------------------------------------------------- */

/** Unanchored sources for the custom inline extensions. `lib/markdown.ts` anchors them with `^`. */
export const INLINE_SOURCES = {
    sub: "~(?!~)(.+?)~",
    sup: "\\^(?!\\^)(.+?)\\^",
    mark: "==(.+?)==",
    footnoteRef: "\\[\\^([^\\]]+)\\]"
} as const;

/** Custom tags stored in markdown and rendered as components. `mdimg` is written by the backend on save. */
export const EMBED_TAGS = ["user", "audioplayer", "seemorebutton", "embedweb", "mdimg"] as const;
export type EmbedTag = (typeof EMBED_TAGS)[number];

/** Self-closing (`<x />`), bare (`<x>`) or empty-paired (`<x></x>`) — the same forms the marked tokenizers accept. */
const EMBED_SOURCE = `<(${EMBED_TAGS.join("|")})\\b([^>]*?)\\s*(?:\\/>|>(?:\\s*<\\/\\1\\s*>)?)`;

export type Embed = {
    tag: EmbedTag;
    start: number;
    end: number;
    raw: string;
    attrs: Record<string, string>;
};

export function parseAttrs(source: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const rx = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>/]+))/g;
    let m: RegExpExecArray | null;
    while ((m = rx.exec(source))) {
        attrs[m[1]] = (m[2] ?? m[3] ?? m[4] ?? "").replace(/&quot;/g, '"');
    }
    return attrs;
}

/** Every embed tag in `text`, left to right. */
export function findEmbeds(text: string): Embed[] {
    const embeds: Embed[] = [];
    const rx = new RegExp(EMBED_SOURCE, "g");
    let m: RegExpExecArray | null;
    while ((m = rx.exec(text))) {
        embeds.push({ tag: m[1] as EmbedTag, start: m.index, end: m.index + m[0].length, raw: m[0], attrs: parseAttrs(m[2] || "") });
    }
    return embeds;
}

/** Build a self-closing embed tag. Undefined values are omitted; `"` is escaped so it can't end the attribute. */
export function buildEmbedTag(tag: string, attrs: Record<string, string | undefined>): string {
    const props = Object.entries(attrs)
        .filter((entry): entry is [string, string] => entry[1] !== undefined)
        .map(([key, val]) => `${key}="${val.replace(/"/g, "&quot;")}"`)
        .join(" ");
    return `<${tag}${props ? " " + props : ""} />`;
}

/**
 * Keep embeds atomic: if an edit touched any part of an embed tag, the whole tag goes, and what the
 * user typed is kept. Returns the text to store and, when it differs from what the textarea holds,
 * where the caret should land.
 */
export function protectEmbeds(prev: string, next: string): { value: string; caret?: number } {
    if (prev === next) return { value: next };

    let prefix = 0;
    const plen = prev.length;
    const nlen = next.length;
    while (prefix < plen && prefix < nlen && prev.charCodeAt(prefix) === next.charCodeAt(prefix)) prefix++;

    let suffix = 0;
    const maxSuffix = Math.min(plen - prefix, nlen - prefix);
    while (suffix < maxSuffix && prev.charCodeAt(plen - 1 - suffix) === next.charCodeAt(nlen - 1 - suffix)) suffix++;

    const changedStart = prefix;
    const changedEnd = plen - suffix;
    const touched = findEmbeds(prev).filter((t) => changedEnd > t.start && changedStart < t.end);
    if (touched.length === 0) return { value: next };

    const start = Math.min(changedStart, ...touched.map((t) => t.start));
    const end = Math.max(changedEnd, ...touched.map((t) => t.end));
    const inserted = next.slice(prefix, nlen - suffix);
    return { value: prev.slice(0, start) + inserted + prev.slice(end), caret: start + inserted.length };
}

/* ----------------------------------------------------------------------------------------------- */
/* Autocomplete triggers                                                                           */
/* ----------------------------------------------------------------------------------------------- */

export type Trigger = { kind: "mention" | "component"; start: number; query: string };

/**
 * The `@mention` or `/component` token the caret is at the end of, if any.
 *
 * Both only count at the start of a word, so `a@b.com`, `https://x` and `a/b` never open a menu.
 */
export function detectTrigger(value: string, caret: number): Trigger | null {
    const before = value.slice(0, caret);
    const mention = /(?:^|[\s(])@([^\s@<>]{0,40})$/.exec(before);
    if (mention) return { kind: "mention", start: caret - mention[1].length - 1, query: mention[1] };
    const component = /(?:^|\s)\/([\w-]{0,40})$/.exec(before);
    if (component) return { kind: "component", start: caret - component[1].length - 1, query: component[1] };
    return null;
}

/* ----------------------------------------------------------------------------------------------- */
/* Highlighting                                                                                    */
/* ----------------------------------------------------------------------------------------------- */

/**
 * How one run of characters should be painted — never how *wide* it should be. The textarea under
 * the highlight layer positions the caret with plain weight-400 text, so every decoration must leave
 * advance widths alone (colour, background, stroke, synthesized slant, lines).
 */
export type HighlightKind =
    | "text"
    /** Markdown punctuation: hashes, asterisks, backticks, brackets, pipes. Dimmed, never hidden. */
    | "syntax"
    | "strong"
    | "emphasis"
    | "strike"
    /** A code span, or any line inside a fence. */
    | "code"
    | "mark"
    | "script"
    /** The visible half of a `[label](url)` / `![alt](url)`, and callout titles. */
    | "label"
    /** Link targets and bare URLs. */
    | "url"
    | "footnote"
    /** `:::type` callout markers. */
    | "callout"
    /** A whole embed tag. Carries `embed`. */
    | "embed";

export interface HighlightSpan {
    text: string;
    kind: HighlightKind;
    /** On `embed` spans only: which tag, and where it starts in the source. */
    embed?: { tag: EmbedTag; start: number };
    /** Part of a `#` heading's words. */
    heading?: boolean;
    /** Inside a `>` quote. */
    quoted?: boolean;
    /** Inside a ticked `- [x]` task. */
    struck?: boolean;
}

/**
 * Inline syntax. At any one position the first alternative wins, and the earliest position wins over
 * all — so code spans are never descended into, `~~strike~~` beats `~sub~`, and `**` beats `*`.
 * The custom extensions reuse `INLINE_SOURCES` with their capture groups turned non-capturing.
 */
const nonCapturing = (source: string) => source.replace(/\((?!\?)/g, "(?:");

const INLINE_PATTERN = new RegExp(
    [
        "(`[^`\\n]+`)",
        `(<(?<embedTag>${EMBED_TAGS.join("|")})\\b[^>]*?\\s*(?:\\/>|>(?:\\s*<\\/\\k<embedTag>\\s*>)?))`,
        `(${nonCapturing(INLINE_SOURCES.footnoteRef)})`,
        "(!\\[[^\\]\\n]*\\]\\([^)\\n]+\\))",
        "(\\[[^\\]\\n]+\\]\\([^)\\n]+\\))",
        "(https?:\\/\\/[^\\s<>()]+)",
        "(\\*\\*[^*\\n]+\\*\\*|(?<!\\w)__[^_\\n]+__(?!\\w))",
        "(~~[^~\\n]+~~)",
        `(${nonCapturing(INLINE_SOURCES.mark)})`,
        "(\\*[^*\\s][^*\\n]*\\*|(?<!\\w)_[^_\\s][^_\\n]*_(?!\\w))",
        `(${nonCapturing(INLINE_SOURCES.sub)}|${nonCapturing(INLINE_SOURCES.sup)})`
    ].join("|")
);

const FENCE = /^\s*(```|~~~)/;
const RULE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
const HEADING = /^(#{1,6}\s+)/;
const QUOTE = /^(\s*>\s?)/;
const LIST = /^(\s*(?:[-*+]|\d+[.)])\s+)/;
const TASK = /^(\[([ xX])\]\s?)/;
const CALLOUT_OPEN = /^(:::\w+)([ \t]+)?(.*)$/;
const CALLOUT_CLOSE = /^:::\s*$/;
const FOOTNOTE_DEF = /^(\[\^[^\]]+\]:)/;
const TABLE_SEPARATOR = /^\s*\|?\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)+\|?\s*$/;
const LINK_PARTS = /^(!?\[)([^\]]*)(\]\()([^)]+)(\))$/;

/**
 * Split markdown source into spans to paint. `spans.map((s) => s.text).join("")` is always the input.
 *
 * Line-based: a fence swallows everything until its closing marker, and a line's leading marker is
 * decided before its inline content. Adjacent spans of the same kind are merged, so ordinary prose is
 * a handful of DOM nodes rather than one per line.
 */
export function highlightSource(text: string): HighlightSpan[] {
    const spans: HighlightSpan[] = [];
    let at = 0;
    let heading = false;
    let quoted = false;
    let struck = false;
    let tableRow = false;

    const push = (piece: string, kind: HighlightKind, embed?: HighlightSpan["embed"]) => {
        if (!piece) return;
        at += piece.length;
        const last = spans[spans.length - 1];
        if (last && !embed && !last.embed && last.kind === kind && !last.heading === !heading && !last.quoted === !quoted && !last.struck === !struck) {
            last.text += piece;
            return;
        }
        const span: HighlightSpan = { text: piece, kind };
        if (embed) span.embed = embed;
        if (heading) span.heading = true;
        if (quoted) span.quoted = true;
        if (struck) span.struck = true;
        spans.push(span);
    };

    /** Plain text; inside a table row the pipes are punctuation. */
    const plain = (source: string, kind: HighlightKind = "text") => {
        if (!tableRow) return push(source, kind);
        for (const part of source.split(/(\|)/)) push(part, part === "|" ? "syntax" : kind);
    };

    const wrapped = (piece: string, marks: number, kind: HighlightKind) => {
        push(piece.slice(0, marks), "syntax");
        plain(piece.slice(marks, -marks), kind);
        push(piece.slice(-marks), "syntax");
    };

    const token = (piece: string) => {
        const first = piece[0];
        if (first === "`") return wrapped(piece, 1, "code");
        if (first === "<") return push(piece, "embed", { tag: /^<(\w+)/.exec(piece)![1] as EmbedTag, start: at });
        if (piece.startsWith("[^")) return push(piece, "footnote");
        if (first === "[" || first === "!") {
            const parts = LINK_PARTS.exec(piece)!;
            push(parts[1], "syntax");
            push(parts[2], "label");
            push(parts[3], "syntax");
            push(parts[4], "url");
            push(parts[5], "syntax");
            return;
        }
        if (first === "h") return push(piece, "url");
        if (piece.startsWith("**") || piece.startsWith("__")) return wrapped(piece, 2, "strong");
        if (piece.startsWith("~~")) return wrapped(piece, 2, "strike");
        if (piece.startsWith("==")) return wrapped(piece, 2, "mark");
        if (first === "*" || first === "_") return wrapped(piece, 1, "emphasis");
        return wrapped(piece, 1, "script");
    };

    const inline = (source: string) => {
        let rest = source;
        for (;;) {
            const match = INLINE_PATTERN.exec(rest);
            if (!match) return plain(rest);
            plain(rest.slice(0, match.index));
            token(match[0]);
            rest = rest.slice(match.index + match[0].length);
        }
    };

    let fence: string | null = null;

    text.split("\n").forEach((line, index) => {
        // The separator the split removed. Inside a fence it belongs to the block's background.
        if (index > 0) push("\n", fence ? "code" : "text");

        const fenceMatch = FENCE.exec(line);
        if (fence) {
            if (fenceMatch && fenceMatch[1] === fence) {
                push(line, "syntax");
                fence = null;
            } else {
                push(line, "code");
            }
            return;
        }
        if (fenceMatch) {
            push(line, "syntax");
            fence = fenceMatch[1];
            return;
        }
        if (RULE.test(line) || CALLOUT_CLOSE.test(line)) return push(line, "syntax");

        const callout = CALLOUT_OPEN.exec(line);
        if (callout) {
            push(callout[1], "callout");
            push(callout[2] || "", "text");
            heading = true;
            inline(callout[3]);
            heading = false;
            return;
        }

        const hashes = HEADING.exec(line);
        if (hashes) {
            push(hashes[1], "syntax");
            heading = true;
            inline(line.slice(hashes[1].length));
            heading = false;
            return;
        }

        let rest = line;

        const footnote = FOOTNOTE_DEF.exec(rest);
        if (footnote) {
            push(footnote[1], "footnote");
            rest = rest.slice(footnote[1].length);
        }

        let quote: RegExpExecArray | null;
        while ((quote = QUOTE.exec(rest))) {
            push(quote[1], "syntax");
            rest = rest.slice(quote[1].length);
            quoted = true;
        }

        if (TABLE_SEPARATOR.test(rest) && rest.includes("|")) {
            push(rest, "syntax");
            quoted = false;
            return;
        }

        const list = LIST.exec(rest);
        if (list) {
            push(list[1], "syntax");
            rest = rest.slice(list[1].length);
            const task = TASK.exec(rest);
            if (task) {
                push(task[1], "syntax");
                rest = rest.slice(task[1].length);
                struck = task[2] !== " ";
            }
        }

        tableRow = rest.trimStart().startsWith("|");
        inline(rest);
        tableRow = false;
        struck = false;
        quoted = false;
    });

    return spans;
}
