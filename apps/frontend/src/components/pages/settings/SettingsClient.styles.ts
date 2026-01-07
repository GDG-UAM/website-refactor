import styled from "styled-components";

export const Outer = styled.div`
    padding: 40px 32px 80px;
    max-width: 1280px;
    margin: 0 auto;
    @media (max-width: 1000px) {
        padding: 16px 16px 64px;
    }
`;
export const LayoutShell = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 32px;
    width: 100%;
    @media (max-width: 1000px) {
        max-width: 600px;
        flex-direction: column;
        gap: 20px;
        margin: 0 auto;
    }
`;
export const ContentPanel = styled.main`
    flex: 1;
    min-width: 0;
    overflow: visible;
    width: 100%;

    & input {
        background: var(--color-white) !important;
    }
`;
export const Heading = styled.h1`
    margin: 0 0 12px;
`;
export const Sub = styled.p`
    margin: 0 0 24px;
    color: var(--settings-experiment-sub);
    line-height: 1.45;
`;
export const Chip = styled.span`
    display: inline-block;
    font-size: 12px;
    padding: 2px 8px 3px;
    border-radius: 999px;
    background: var(--settings-chip-bg);
    color: var(--settings-chip-text);
    font-weight: 500;
    margin-left: 8px;
`;
