/**
 * Where a textarea's caret actually is.
 *
 * A textarea won't tell you. The only technique that works is laying the same text out again in a
 * hidden div wearing the textarea's own typography, and asking *that* where the split falls.
 */

/** The properties a mirror must copy for its line breaks to fall where the textarea's do. */
const MIRRORED_STYLES = [
    "font-family",
    "font-size",
    "font-weight",
    "font-style",
    "letter-spacing",
    "line-height",
    "text-indent",
    "text-transform",
    "tab-size",
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
    "border-top-width",
    "border-right-width",
    "border-bottom-width",
    "border-left-width",
    "box-sizing"
] as const;

/** Where the character at `index` sits inside the textarea's box, in CSS pixels, scroll accounted for. */
export function caretOffset(textarea: HTMLTextAreaElement, index: number): { top: number; left: number } {
    const mirror = document.createElement("div");
    const computed = window.getComputedStyle(textarea);
    for (const property of MIRRORED_STYLES) {
        mirror.style.setProperty(property, computed.getPropertyValue(property));
    }
    mirror.style.position = "absolute";
    mirror.style.top = "0";
    mirror.style.left = "-9999px";
    mirror.style.visibility = "hidden";
    mirror.style.whiteSpace = "pre-wrap";
    mirror.style.overflowWrap = "break-word";
    mirror.style.width = `${textarea.clientWidth}px`;

    mirror.textContent = textarea.value.slice(0, index);
    const marker = document.createElement("span");
    /* The rest of the text goes inside the marker so it wraps exactly as the real text does; without
       it a caret at the end of a line would measure at the start of the next one. A full stop stands
       in for an empty tail, since a zero-width span has no position to report. */
    marker.textContent = textarea.value.slice(index) || ".";
    mirror.appendChild(marker);

    document.body.appendChild(mirror);
    const top = marker.offsetTop - textarea.scrollTop;
    const left = marker.offsetLeft;
    mirror.remove();
    return { top, left };
}
