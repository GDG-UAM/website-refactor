import styled from "styled-components";

export const Container = styled.div`
    width: 100%;
    margin: 1em 0;
    border: 2px solid var(--color-gray-300);
    border-radius: 12px;
    overflow: hidden;
    background: var(--color-white, #fff);
`;

export const TitleBar = styled.div<{ $showBorder: boolean }>`
    padding: 8px 12px;
    background: var(--markdown-thead-bg);
    border-bottom: ${({ $showBorder }) => ($showBorder ? "1px solid var(--color-gray-300)" : "none")};
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    color: var(--markdown-base-text);

    @media (min-width: 768px) {
        flex-wrap: nowrap;
    }
`;

export const TopRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
    order: 1;

    @media (min-width: 768px) {
        flex: 0 0 auto;
        order: 1;
    }
`;

export const LeftSection = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
`;

export const Favicon = styled.img`
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    object-fit: contain;
`;

export const FaviconPlaceholder = styled.div`
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    background: var(--markdown-inline-code-border);
    border-radius: 2px;
`;

export const TitleText = styled.span`
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
`;

export const URLBar = styled.a`
    flex: 1;
    min-width: 0;
    width: 100%;
    flex-basis: 100%;
    padding: 4px 12px;
    background: var(--color-white);
    border: 1px solid var(--markdown-table-border);
    border-bottom: 1px solid var(--markdown-table-border) !important;
    border-radius: 16px;
    font-size: 0.85rem;
    color: var(--markdown-base-text);
    text-decoration: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
    transition: all 0.2s;
    order: 3;

    &:hover {
        background: var(--markdown-callout-bg);
        border-color: var(--markdown-inline-code-border);
    }

    @media (min-width: 768px) {
        width: auto;
        flex-basis: auto;
        order: 2;
    }
`;

export const RightSection = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    padding: 8px;
    margin: -8px;
    margin-left: 0;
    border-radius: 4px;
    transition: background 0.2s;
    order: 2;
    flex-shrink: 0;

    @media (min-width: 768px) {
        order: 3;

        &:hover {
            background: var(--markdown-callout-bg);
        }
    }
`;

export const BrowserButton = styled.button`
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
`;

export const MinimizeButton = styled(BrowserButton)`
    background: var(--google-yellow);
`;

export const MaximizeButton = styled(BrowserButton)`
    background: var(--google-green);
`;

export const CloseButton = styled(BrowserButton)`
    background: var(--google-red);
`;

export const IframeWrapper = styled.div<{ $collapsed: boolean; $height: string }>`
    position: relative;
    width: 100%;
    overflow: hidden;
    max-height: ${({ $collapsed, $height }) => ($collapsed ? "0" : `${$height}px`)};
    transition: max-height 0.3s ease-in-out;
`;

export const StyledIframe = styled.iframe`
    width: 100%;
    border: none;
    display: block;
`;

export const LoadingOverlay = styled.div`
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--markdown-callout-bg);
    color: var(--markdown-base-text);
    font-size: 0.9rem;
`;
