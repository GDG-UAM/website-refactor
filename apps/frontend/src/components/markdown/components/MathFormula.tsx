import React from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * LaTeX from a `<latex>` placeholder. KaTeX escapes its input and, without `trust`, refuses `\href`,
 * `\htmlClass` and friends, so its output is safe to inject. A formula that doesn't parse shows its
 * source in red instead of breaking the article.
 */
export default function MathFormula({ tex, display }: { tex: string; display?: boolean }) {
    const html = React.useMemo(() => katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: "ignore" }), [tex, display]);
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
