import styled from "styled-components";

export const Wrapper = styled.div<{ $error?: boolean; $disabled?: boolean }>`
    position: relative;
    margin-top: 10px;
    width: 100%;
`;

export const Label = styled.label<{ $shrink: boolean; $disabled?: boolean; $error?: boolean; $focused?: boolean }>`
    position: absolute;
    left: 0;
    top: 0;
    z-index: 10;
    display: block;
    font-weight: 400;
    pointer-events: none;
    color: ${({ $disabled, $error, $focused }) =>
        $disabled ? "rgba(0, 0, 0, 0.38)" : $focused ? "var(--google-blue)" : $error ? "var(--google-red)" : "var(--google-light-gray)"};
    transform-origin: top left;
    transition:
        transform 200ms cubic-bezier(0, 0, 0.2, 1) 0ms,
        color 200ms cubic-bezier(0, 0, 0.2, 1) 0ms,
        background-color 200ms;
    text-box-trim: trim-both;

    transform: ${({ $shrink }) => ($shrink ? "translate(12px, -9px) scale(0.75)" : "translate(14px, 10px) scale(1)")};
    background-color: ${({ $shrink }) => ($shrink ? "var(--color-gray-50)" : "transparent")};
    padding: ${({ $shrink }) => ($shrink ? "0 4px" : "0")};

    ${({ $shrink }) =>
        $shrink &&
        `
    font-weight: 500;
  `}
`;

export const Control = styled.div<{ $disabled?: boolean; $error?: boolean; $focused?: boolean }>`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: ${({ $focused }) => ($focused ? "9.5px 13px" : "10.5px 14px")};
    min-height: 40px;
    border: ${({ $focused, $error }) =>
        $focused ? "2px solid var(--google-blue)" : $error ? "1px solid var(--google-red)" : "1px solid var(--google-extra-light-gray)"};
    border-radius: 4px;
    background-color: transparent;
    cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "text")};

    &:hover {
        border-color: ${({ $disabled, $focused, $error }) =>
            $disabled ? "rgba(0, 0, 0, 0.38)" : $focused ? "var(--google-blue)" : $error ? "var(--google-red)" : "rgba(0, 0, 0, 0.87)"};
    }
`;

export const Input = styled.input`
    border: none;
    outline: none;
    background: transparent;
    color: var(--foreground);
    font-family: inherit;
    font-size: 14px;
    line-height: 1.4375em;
    flex: 1;
    min-width: 60px;
    padding: 2px 0;

    &:disabled {
        cursor: not-allowed;
    }
`;

export const Chip = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    background-color: #f3f4f6;
    border-radius: 16px;
    padding: 2px 4px 2px 2px;
    font-size: 13px;
    color: var(--foreground);
    user-select: none;
    height: 24px;
`;

export const Avatar = styled.img`
    width: 20px;
    height: 20px;
    border-radius: 50%;
    object-fit: cover;
`;

export const ChipLabel = styled.span`
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const RemoveButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    color: #9ca3af;
    border-radius: 50%;
    width: 16px;
    height: 16px;

    &:hover {
        color: #6b7280;
        background-color: rgba(0, 0, 0, 0.05);
    }
`;

export const Dropdown = styled.div`
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 1000;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    margin-top: 4px;
    max-height: 240px;
    overflow-y: auto;
`;

export const DropdownItem = styled.div<{ $active?: boolean }>`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    cursor: pointer;
    background-color: ${({ $active }) => ($active ? "#f3f4f6" : "transparent")};

    &:hover {
        background-color: #f9fafb;
    }
`;

export const NoResults = styled.div`
    padding: 12px;
    color: #6b7280;
    font-size: 14px;
    text-align: center;
`;
