import styled from "styled-components";

export const AvatarButton = styled.button`
    appearance: none;
    border: none;
    background: transparent;
    border-radius: 50%;
    padding: 0;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    transition:
        background-color 0.15s ease-in-out,
        box-shadow 0.15s ease-in-out;
    &:hover {
        background: var(--navbar-avatar-bg-hover);
    }
    &:focus-visible {
        outline: none;
        box-shadow: var(--navbar-avatar-focus-ring);
    }
`;

export const UserMenuIconSlot = styled.span`
    width: 20px;
    height: 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    svg {
        width: 24px;
        height: 24px;
    }
`;

export const UserMenuDivider = styled.hr`
    border: none;
    height: 1px;
    background: var(--navbar-user-divider-bg);
    margin: 6px 4px;
`;

// Refined compact user menu list
export const UserMenuWrapper = styled.div`
    position: relative;
    height: 36px;
`;

export const UserMenuList = styled.ul<{ $open: boolean }>`
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    margin: 0;
    padding: 6px;
    list-style: none;
    background: var(--navbar-user-menu-bg);
    border: 1px solid var(--navbar-user-menu-border);
    box-shadow: var(--navbar-user-menu-shadow);
    border-radius: 10px;
    display: ${({ $open }) => ($open ? "block" : "none")};
    z-index: 1100;
    width: max-content;
    min-width: 160px;
`;

export const UserMenuItem = styled.li`
    button,
    a {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        border: none;
        background: transparent;
        border-radius: 8px;
        cursor: pointer;
        color: #3c4043;
        color: var(--navbar-user-menu-item-text);
        text-decoration: none;
        font: inherit;
        text-align: left;
        line-height: 1;
        white-space: nowrap;
        font-size: 0.92rem;
        max-width: 100%;
        &:hover {
            background: var(--navbar-user-menu-item-bg-hover);
        }
        &:focus-visible {
            outline: none;
            background: var(--navbar-user-menu-item-bg-focus);
        }
    }
`;
