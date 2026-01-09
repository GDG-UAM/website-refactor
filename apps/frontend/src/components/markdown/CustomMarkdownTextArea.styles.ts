import styled from "styled-components";

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

// Surface for overlayed rendering
export const Surface = styled.div<{ $disabled?: boolean; $error?: boolean }>`
    position: relative;
    margin-top: 10px; /* Space for the floating label */
    border-radius: 4px;

    ${({ $disabled, $error }) =>
        !$disabled &&
        `
    &:focus-within ${Label} {
      color: var(--google-blue);
    }
  `}
`;

// Display transformed content above the invisible textarea
export const Overlay = styled.div<{ $disabled?: boolean }>`
    position: absolute;
    inset: 0;
    color: ${({ $disabled }) => ($disabled ? "rgba(0, 0, 0, 0.38)" : "inherit")};
    white-space: pre-wrap;
    word-break: break-word;
    padding: 10.5px 14px;
    pointer-events: none;
    overflow: auto;
    box-sizing: border-box;
    max-height: 100%;
    -webkit-overflow-scrolling: touch;
    width: 100%;
    padding-right: 0;
    z-index: 3;
    height: calc(100% - 7px);
    display: ${({ $disabled }) => ($disabled ? "none" : "block")};
    filter: ${({ $disabled }) => ($disabled ? "grayscale(100%) opacity(0.8)" : "none")};

    /* hide native scrollbars (visual only) so the textarea scroll remains the interactive one */
    scrollbar-width: none; /* Firefox */
    &::-webkit-scrollbar {
        display: none; /* WebKit */
    }
    font-family: inherit;
    font-size: 14px;
    line-height: 1.4375em;
`;

export const TextArea = styled.textarea<{ $error?: boolean }>`
    width: 100%;
    padding: 10.5px 14px;
    border-radius: 4px;
    border: 1px solid ${({ $error }) => ($error ? "var(--google-red)" : "var(--google-extra-light-gray)")};
    background-color: transparent;
    color: transparent; /* show text via Overlay */
    caret-color: var(--foreground);
    resize: vertical; /* only vertical */
    font-family: inherit;
    font-size: 14px;
    line-height: 1.4375em;
    box-sizing: border-box;
    min-height: 120px;
    position: relative;
    z-index: 2;

    &:hover {
        border-color: ${({ $error }) => ($error ? "var(--google-red)" : "rgba(0, 0, 0, 0.87)")};
    }

    &:focus:not(:disabled) {
        outline: none;
        border: 2px solid var(--google-blue);
        padding: 9.5px 13px; /* Adjust for 2px border to prevent layout shift */
    }

    &:disabled {
        cursor: not-allowed;
        border-color: rgba(0, 0, 0, 0.38);
        color: rgba(0, 0, 0, 0.38);
        -webkit-text-fill-color: rgba(0, 0, 0, 0.38); /* For Safari */
    }

    &:disabled:hover {
        border-color: rgba(0, 0, 0, 0.6);
    }
`;

export const Dropdown = styled.div`
    position: absolute;
    z-index: 30;
    top: calc(100% + 6px);
    left: 0;
    min-width: 320px;
    max-width: 400px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
    padding: 8px;
`;
export const Search = styled.input`
    width: 100%;
    padding: 8px 10px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    margin-bottom: 8px;
    box-sizing: border-box;
`;

export const Item = styled.button<{ $active?: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    outline: none;
    width: 100%;
    text-align: left;
    background: ${({ $active }) => ($active ? "#f3f4f6" : "transparent")};
    border: none;
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
    color: #6b7280;
`;

export const PropInput = styled.input`
    width: 100%;
    padding: 8px 10px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    margin-bottom: 8px;
    font-size: 14px;
    box-sizing: border-box;
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
    color: #374151;
`;

export const SubmitButtonWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-top: 4px;
`;
