import styled from "styled-components";

// Validated categorical pair (CVD-safe); single-series lists reuse their entity's color.
export const COLORS = {
    blog: "#1a73e8",
    newsletter: "#e37400",
    links: "#188038",
    authors: "var(--color-gray-500)"
};

export const Controls = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
`;

export const Tiles = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
`;

export const Tile = styled.div`
    border: 1px solid var(--color-gray-200);
    border-radius: 12px;
    padding: 16px 20px;
`;

export const TileLabel = styled.div`
    font-size: 0.875rem;
    color: var(--color-gray-500);
`;

export const TileValue = styled.div`
    font-family: var(--font-title);
    font-size: 2rem;
    font-weight: 600;
    line-height: 1.2;
    margin: 4px 0;
    font-variant-numeric: tabular-nums;
`;

export const TileSub = styled.div`
    font-size: 0.8rem;
    color: var(--color-gray-500);
`;

export const Section = styled.section`
    border: 1px solid var(--color-gray-200);
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 24px;
`;

export const SectionTitle = styled.h2`
    font-size: 1.15rem;
    font-weight: 600;
    margin: 0 0 12px 0;
`;

export const Note = styled.p`
    font-size: 0.8rem;
    color: var(--color-gray-500);
    margin: -8px 0 12px 0;
`;

export const ShareBar = styled.div`
    display: flex;
    gap: 2px;
    height: 16px;
    border-radius: 4px;
    overflow: hidden;
    background: var(--color-gray-100);
`;

export const Legend = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-top: 8px;
    font-size: 0.875rem;
`;

export const Swatch = styled.span<{ $color: string }>`
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 2px;
    margin-right: 6px;
    background: ${(p) => p.$color};
`;

export const Rows = styled.ul`
    list-style: none;
    margin: 0;
    padding: 0;
`;

export const Row = styled.li<{ $dim: boolean }>`
    display: grid;
    grid-template-columns: auto minmax(0, 1.2fr) minmax(80px, 1fr) 72px;
    align-items: center;
    gap: 12px;
    padding: 4px 0;
    opacity: ${(p) => (p.$dim ? 0.45 : 1)};

    &:hover {
        background: var(--color-gray-50);
    }
`;

export const RowTitle = styled.div`
    min-width: 0;

    a {
        color: inherit;
        font-weight: 500;
        text-decoration: none;
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    a:hover {
        text-decoration: underline;
    }
`;

export const RowMeta = styled.div`
    font-size: 0.75rem;
    color: var(--color-gray-500);
`;

export const Track = styled.div`
    height: 12px;
`;

export const Bar = styled.div<{ $color: string }>`
    height: 100%;
    min-width: 2px;
    background: ${(p) => p.$color};
    border-radius: 0 4px 4px 0;
`;

export const Value = styled.div`
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
`;
