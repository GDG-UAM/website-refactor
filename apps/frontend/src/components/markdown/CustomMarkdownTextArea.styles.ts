import styled, { css } from "styled-components";

export const Wrapper = styled.div`
    position: relative;
`;

export const Label = styled.label<{ $shrink: boolean; $disabled?: boolean; $error?: boolean }>`
    position: absolute;
    left: 0;
    top: 0;
    z-index: 10;
    display: block;
    font-weight: 400;
    pointer-events: none;
    color: ${({ $disabled }) => ($disabled ? "rgba(0, 0, 0, 0.38)" : "var(--google-light-gray)")};
    transform-origin: top left;
    transition:
        transform 200ms cubic-bezier(0, 0, 0.2, 1) 0ms,
        color 200ms cubic-bezier(0, 0, 0.2, 1) 0ms,
        background-color 200ms;
    text-box-trim: trim-both;

    /* Shrink state (floating) */
    transform: ${({ $shrink }) => ($shrink ? "translate(12px, -9px) scale(0.75)" : "translate(14px, 10px) scale(1)")};

    background-color: ${({ $shrink }) => ($shrink ? "var(--color-gray-50)" : "transparent")};
    padding: ${({ $shrink }) => ($shrink ? "0 4px" : "0")};

    ${({ $shrink }) =>
        $shrink &&
        `
    font-weight: 500;
  `}
    ${({ $error }) => $error && `color: var(--google-red);`}
`;

/* The box around the editor. The border lives here rather than on the textarea, so the textarea and
   the highlight layer have identical boxes and nothing moves when the focus ring appears. */
export const Surface = styled.div<{ $disabled?: boolean; $error?: boolean }>`
    position: relative;
    border-radius: 4px;
    border: 1px solid ${({ $error, $disabled }) => ($error ? "var(--google-red)" : $disabled ? "rgba(0, 0, 0, 0.26)" : "var(--google-extra-light-gray)")};
    transition:
        border-color 150ms,
        box-shadow 150ms;

    ${({ $disabled, $error }) =>
        !$disabled &&
        css`
            &:hover {
                border-color: ${$error ? "var(--google-red)" : "rgba(0, 0, 0, 0.87)"};
            }
            &:focus-within {
                border-color: ${$error ? "var(--google-red)" : "var(--google-blue)"};
                box-shadow: inset 0 0 0 1px ${$error ? "var(--google-red)" : "var(--google-blue)"};
            }
            &:focus-within ${Label} {
                color: ${$error ? "var(--google-red)" : "var(--google-blue)"};
            }
        `}
`;

/* Every property that decides where a line breaks, on both layers. If the two ever disagree, the
   highlight slides off the text under the caret. */
const sharedText = css`
    box-sizing: border-box;
    width: 100%;
    margin: 0;
    border: 0;
    padding: 10.5px 14px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 400;
    font-style: normal;
    line-height: 1.4375em;
    letter-spacing: normal;
    tab-size: 4;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    word-break: normal;
`;

/**
 * The highlight layer, behind the textarea.
 *
 * Nothing here may change a glyph's advance width:
 *  - bold and headings use a text stroke, not `font-weight` (Open Sans 600 is loaded and is wider);
 *  - italic is a real `font-style`, which is only safe because `app/layout.tsx` loads no italic faces,
 *    so the browser synthesizes a slant from the upright glyphs. If an italic face is ever added,
 *    switch this to a skew transform or the layers will drift;
 *  - code and marks are backgrounds, never a monospace font or padding;
 *  - markdown punctuation is dimmed, never hidden, so the caret never walks through invisible characters.
 */
export const HighlightLayer = styled.div<{ $disabled?: boolean }>`
    ${sharedText}
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    color: var(--foreground);
    ${({ $disabled }) => $disabled && "opacity: 0.45; filter: grayscale(1);"}

    .syntax {
        color: color-mix(in srgb, var(--foreground) 42%, transparent);
    }
    .strong,
    .heading {
        -webkit-text-stroke: 0.35px currentColor;
    }
    .heading {
        color: var(--google-blue);
    }
    .emphasis,
    .quoted {
        font-style: italic;
    }
    .quoted:not(.syntax) {
        color: color-mix(in srgb, var(--foreground) 65%, transparent);
    }
    .strike,
    .struck:not(.syntax) {
        text-decoration: line-through;
    }
    .struck:not(.syntax) {
        color: color-mix(in srgb, var(--foreground) 55%, transparent);
    }
    .code {
        background: color-mix(in srgb, var(--foreground) 8%, transparent);
        border-radius: 3px;
    }
    .mark {
        background: color-mix(in srgb, var(--google-yellow) 40%, transparent);
    }
    .script {
        color: var(--google-green);
    }
    .label,
    .footnote {
        color: var(--google-blue);
    }
    .url {
        color: var(--google-light-gray);
        text-decoration: underline;
        text-decoration-color: color-mix(in srgb, var(--google-light-gray) 40%, transparent);
    }
    .callout {
        color: var(--google-green);
        -webkit-text-stroke: 0.35px currentColor;
    }
    .embed {
        color: transparent;
        border-radius: 4px;
        -webkit-box-decoration-break: clone;
        box-decoration-break: clone;
    }
`;

export const TextArea = styled.textarea<{ $hideUnfocusedPlaceholder?: boolean }>`
    ${sharedText}
    position: relative;
    z-index: 1;
    display: block;
    resize: none;
    overflow: hidden;
    outline: none;
    background: transparent;
    color: transparent;
    -webkit-text-fill-color: transparent;
    caret-color: var(--foreground);

    /* A textarea paints its selection above everything behind it; keep it translucent and inkless so
       the highlighting underneath stays visible. */
    &::selection {
        color: transparent;
        background: color-mix(in srgb, var(--google-blue) 22%, transparent);
    }

    &::placeholder {
        color: var(--google-light-gray);
        -webkit-text-fill-color: var(--google-light-gray);
        opacity: 1;
    }
    ${({ $hideUnfocusedPlaceholder }) =>
        $hideUnfocusedPlaceholder &&
        css`
            &:not(:focus)::placeholder {
                opacity: 0;
            }
        `}

    &:disabled {
        cursor: not-allowed;
    }
`;

/* Clickable boxes over each embed, above the textarea. Positioned from one batched measurement. */
export const EmbedCover = styled.span<{ $clickable?: boolean }>`
    position: absolute;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: 4px;
    pointer-events: ${({ $clickable }) => ($clickable ? "auto" : "none")};
    cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};

    &:hover {
        ${({ $clickable }) => $clickable && "box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--foreground) 25%, transparent);"}
    }
`;

export const EmbedLabel = styled.span`
    max-width: 100%;
    padding: 0 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    pointer-events: none;
`;

export const Dropdown = styled.div`
    position: absolute;
    z-index: 30;
    min-width: min(320px, 100%);
    max-width: min(400px, 100%);
    background: var(--background);
    border: 1px solid var(--google-extra-light-gray);
    border-radius: 8px;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
    padding: 8px;
    box-sizing: border-box;
`;

export const Search = styled.input`
    width: 100%;
    padding: 8px 10px;
    border: 1px solid var(--google-extra-light-gray);
    border-radius: 6px;
    margin-bottom: 8px;
    box-sizing: border-box;
    background: transparent;
    color: var(--foreground);
`;

export const Item = styled.div<{ $active?: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    width: 100%;
    box-sizing: border-box;
    text-align: left;
    background: ${({ $active }) => ($active ? "var(--color-gray-100)" : "transparent")};
    cursor: pointer;
    border-radius: 6px;
    color: var(--foreground);
`;

export const Avatar = styled.img`
    width: 20px;
    height: 20px;
    border-radius: 999px;
    object-fit: cover;
`;

export const Empty = styled.div`
    font-size: 12px;
    padding: 4px 2px;
    color: var(--google-light-gray);
`;

export const PropInput = styled.input`
    width: 100%;
    padding: 8px 10px;
    border: 1px solid var(--google-extra-light-gray);
    border-radius: 6px;
    margin-bottom: 8px;
    font-size: 14px;
    box-sizing: border-box;
    background: transparent;
    color: var(--foreground);
`;

export const CheckboxWrapper = styled.label`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    margin-bottom: 8px;
    cursor: pointer;
    user-select: none;
`;

export const Checkbox = styled.input`
    width: 18px;
    height: 18px;
    cursor: pointer;
`;

export const PropLabel = styled.label`
    display: block;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 4px;
    color: var(--google-dark-gray);
`;

export const PopoverHeading = styled.div`
    font-size: 12px;
    font-weight: 600;
    color: var(--google-blue);
    margin-bottom: 8px;
    text-align: center;
`;

export const StepCounter = styled.div`
    font-size: 12px;
    color: var(--google-light-gray);
    margin-bottom: 8px;
`;

export const SubmitButtonWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-top: 4px;
`;
