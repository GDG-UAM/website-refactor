import styled, { keyframes } from "styled-components";

export const SidebarContainer = styled.aside`
    width: 260px;
    flex-shrink: 0;
    align-self: flex-start; /* ensure sticky works inside flex container */
    border: 1px solid rgba(0, 0, 0, 0.06);
    background: var(--settings-sidebar-container-bg);
    display: flex;
    flex-direction: column;
    position: sticky;
    top: calc(var(--navbar-height, 68px) + 16px);
    border-radius: 14px;
    padding: 8px;
    box-shadow:
        0 2px 4px rgba(0, 0, 0, 0.04),
        0 6px 18px rgba(0, 0, 0, 0.06);
    overflow-y: auto;
    scrollbar-width: thin;
    @media (max-width: 1000px) {
        display: none;
    }
`;

export const DesktopWrapper = styled.div`
    position: sticky;
    top: calc(var(--navbar-height, 68px) + 40px);
    align-self: flex-start; /* ensure sticky works within flex parent */
    @media (max-width: 1000px) {
        position: static;
        top: auto;
    }
`;

export const MobileBar = styled.div`
    display: none;
    @media (max-width: 1000px) {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border: 1px solid rgba(0, 0, 0, 0.08);
        background: var(--settings-sidebar-container-bg);
        border-radius: 12px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
        margin-bottom: 12px;
    }
`;

export const ActiveLabel = styled.span`
    font-weight: 600;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const Overlay = styled.div<{ $open: boolean }>`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    opacity: ${({ $open }) => ($open ? 1 : 0)};
    visibility: ${({ $open }) => ($open ? "visible" : "hidden")};
    transition:
        opacity 0.28s cubic-bezier(0.4, 0, 0.2, 1),
        visibility 0.28s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1400;
    @media (min-width: 1001px) {
        display: none;
    }
`;

const slideIn = keyframes`
  from { transform: translateX(-12px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

export const MobilePanel = styled.div<{ $open: boolean }>`
    position: fixed;
    top: var(--navbar-height, 68px); /* dynamic below navbar */
    left: 0;
    max-height: calc(100vh - 80px);
    background: transparent;
    display: flex;
    justify-content: flex-start;
    pointer-events: ${({ $open }) => ($open ? "auto" : "none")};
    z-index: 1450;
    margin: 12px 12px 24px;
    box-sizing: border-box;
    @media (min-width: 1001px) {
        display: none;
    }

    > div {
        background: var(--settings-sidebar-container-bg);
        border: 1px solid rgba(0, 0, 0, 0.08);
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
        border-radius: 14px;
        width: 260px;
        padding: 8px;
        overflow-y: auto;
        max-height: 100%;
        transform: translateY(${({ $open }) => ($open ? "0" : "-8px")});
        opacity: ${({ $open }) => ($open ? 1 : 0)};
        transition:
            opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1),
            transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        animation: ${slideIn} 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    }
`;

export const ListRoot = styled.ul`
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

// Pill defined before ItemButton so we can target it in hover selectors
export const RestrictedPill = styled.span<{ $active?: boolean }>`
    display: inline-block;
    font-size: 10px;
    padding: 3px 7px;
    border-radius: 999px;
    font-weight: 600;
    line-height: 1;
    letter-spacing: 0.3px;
    background: ${({ $active }) => ($active ? "var(--settings-sidebar-chip-bg-active)" : "var(--settings-sidebar-chip-bg-inactive)")};
    color: ${({ $active }) => ($active ? "var(--settings-sidebar-chip-text-active)" : "var(--settings-sidebar-chip-text-inactive)")};
    transition:
        background 0.2s ease,
        color 0.2s ease,
        box-shadow 0.2s ease;
`;

export const ItemButton = styled.button<{ $active?: boolean }>`
    appearance: none;
    border: none;
    background: ${({ $active }) => ($active ? "var(--settings-sidebar-item-bg-active)" : "transparent")};
    color: ${({ $active }) => ($active ? "var(--settings-sidebar-item-text-active)" : "var(--settings-sidebar-item-text-inactive)")};
    display: flex;
    align-items: center;
    gap: 10px;
    text-align: left;
    cursor: pointer;
    width: 100%;
    padding: 10px 12px;
    border-radius: 10px;
    font: inherit;
    font-size: 0.92rem;
    line-height: 1.1;
    transition:
        background-color 0.15s ease-in-out,
        color 0.15s ease-in-out;
    &:hover {
        background: ${({ $active }) => ($active ? "var(--settings-sidebar-item-bg-hover-active)" : "var(--settings-sidebar-item-bg-hover-inactive)")};
    }
    &:focus-visible {
        outline: none;
        background: ${({ $active }) => ($active ? "var(--settings-sidebar-item-bg-hover-active)" : "var(--settings-sidebar-item-bg-hover-inactive)")};
    }
`;

export const IconSlot = styled.span<{ $active?: boolean }>`
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    svg {
        width: 24px;
        height: 24px;
        fill: ${({ $active }) => ($active ? "var(--settings-sidebar-item-icon-text-active)" : "var(--settings-sidebar-item-icon-text-inactive)")};
    }
`;

export const Label = styled.span`
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;
