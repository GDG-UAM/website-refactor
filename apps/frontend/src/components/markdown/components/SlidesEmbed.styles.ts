import styled from "styled-components";

// the ring (which deck ← → drive) only makes sense with a keyboard and a mouse
const KEYBOARD = "@media (hover: hover) and (pointer: fine)";

export const Container = styled.figure`
    width: 100%;
    min-width: 0;
    max-width: 100%;
    margin: 1.5em 0;
    container-type: inline-size;
`;

/* Decks are laid out on a 1920×1080 stage that scales to fit */
export const Frame = styled.div<{ $active: boolean }>`
    position: relative;
    aspect-ratio: 16 / 9;
    border-radius: 12px;
    overflow: hidden;
    background: var(--markdown-code-bg);
    box-shadow:
        0 1px 2px rgba(60, 64, 67, 0.16),
        0 6px 24px -8px rgba(60, 64, 67, 0.28);
    transition: box-shadow 0.25s ease;

    ${KEYBOARD} {
        ${({ $active }) =>
            $active &&
            `box-shadow:
                0 0 0 2px color-mix(in srgb, var(--google-blue) 45%, transparent),
                0 1px 2px rgba(60, 64, 67, 0.16),
                0 6px 24px -8px rgba(60, 64, 67, 0.28);`}
    }

    @media (prefers-reduced-motion: reduce) {
        transition: none;
    }

    iframe {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        border: 0;
    }
`;

export const Caption = styled.figcaption`
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 0 0 4px;
    font-size: 0.9rem;
    color: var(--markdown-base-text);

    /* too narrow for the title next to the buttons: the buttons get the row */
    @container (max-width: 420px) {
        justify-content: flex-end;
        padding-left: 0;
    }
`;

export const Title = styled.span`
    flex: 1;
    min-width: 0;
    font-weight: 500;
    opacity: 0.85;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    @container (max-width: 420px) {
        display: none;
    }
`;

export const Actions = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    min-width: 0;
    flex-wrap: wrap;
    justify-content: flex-end;
`;

export const Notice = styled.div`
    margin: 1em 0;
    padding: 12px 16px;
    border: 2px dashed var(--color-gray-300);
    border-radius: 12px;
    color: var(--markdown-base-text);
    font-size: 0.9rem;
`;
