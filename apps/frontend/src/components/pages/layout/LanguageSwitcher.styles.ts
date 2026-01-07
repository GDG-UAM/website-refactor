import React from "react";
import styled, { keyframes } from "styled-components";

export const FlagImg = styled.img`
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: inline-block;
`;

// Language dropdown styles
export const LangDropdown = styled.div`
    position: relative;
`;

export const LangMenu = styled.ul<{ $open: boolean }>`
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    margin: 0;
    padding: 6px;
    list-style: none;
    background: var(--navbar-lang-menu-bg);
    border: 1px solid var(--navbar-lang-menu-border);
    box-shadow: var(--navbar-lang-menu-shadow);
    border-radius: 10px;
    /* no minimum width to let content define size */
    display: ${({ $open }) => ($open ? "block" : "none")};
    z-index: 1100;
`;

export const LangButton = styled.button`
    appearance: none;
    border: none;
    background: transparent;
    color: var(--navbar-lang-button-text);
    padding: 6px 8px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.15s ease-in-out;
    display: inline-flex;
    align-items: center;
    gap: 6px;

    &:hover {
        background: var(--navbar-lang-button-bg-hover);
    }
`;

export const AiList = styled.div`
    max-height: calc(6 * 44px);
    overflow-y: auto;
`;

export const LangMenuItem = styled.li`
    button {
        width: 100%;
        display: flex;
        align-items: center;
        /* left aligned content */
        gap: 10px;
        padding: 8px 10px;
        border: none;
        background: transparent;
        border-radius: 8px;
        cursor: pointer;
        color: var(--navbar-lang-item-text);
        text-align: left;
        font-family: var(--font-body);
        &:hover {
            background: var(--navbar-lang-item-bg-hover);
        }
        &:disabled {
            background: var(--navbar-lang-item-bg-disabled);
            color: var(--navbar-lang-item-text-disabled);
            cursor: not-allowed;
        }
    }
`;

export const LangName = styled.span`
    min-width: max-content;
`;

export const SearchInput = styled.input`
    width: 260px;
    margin: 4px 6px 8px;
    padding: 8px 10px;
    border: 1px solid var(--navbar-search-input-border);
    border-radius: 8px;
    font-size: 0.95rem;
    outline: none;
    &:focus {
        border-color: var(--navbar-search-input-focus-border);
        box-shadow: var(--navbar-search-input-focus-ring);
    }
`;

export const FlexSpacer = styled.span`
    flex: 1;
`;

export const AvailableIcon = styled.svg.attrs({
    xmlns: "http://www.w3.org/2000/svg",
    height: "20px",
    viewBox: "0 -960 960 960",
    width: "20px",
    fill: "var(--navbar-ai-available-icon)",
    children: React.createElement("path", {
        d: "m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"
    })
})`
    flex-shrink: 0;
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export const SpinnerIcon = styled.svg.attrs({
    xmlns: "http://www.w3.org/2000/svg",
    height: "20px",
    viewBox: "0 -960 960 960",
    width: "20px",
    fill: "var(--navbar-ai-spinner-icon)",
    children: React.createElement("path", {
        d: "M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-155.5t86-127Q252-817 325-848.5T480-880q17 0 28.5 11.5T520-840q0 17-11.5 28.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q133 0 226.5-93.5T800-480q0-17 11.5-28.5T840-520q17 0 28.5 11.5T880-480q0 82-31.5 155t-86 127.5q-54.5 54.5-127 86T480-80Z"
    })
})`
    animation: ${spin} 1s linear infinite;
    flex-shrink: 0;
`;
