import styled from "styled-components";

export const Toolbar = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    padding: 0 12px;
    margin-bottom: 12px;
`;

export const Tabs = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
`;

export const ToolbarEnd = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    margin-left: auto;
`;

/* Same card as AdminTable, aligned with it (AdminTable pads itself by 12px) */
export const Overview = styled.section`
    margin: 0 12px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    overflow: hidden;
`;

/* 1px gaps over a grey background draw the dividers, whatever the wrapping */
export const Kpis = styled.dl`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: 1px;
    margin: 0;
    background: #f3f4f6;
    border-bottom: 1px solid #f3f4f6;

    dt {
        font-size: 0.8125rem;
        color: var(--color-gray-500);
    }
`;

export const Kpi = styled.div`
    min-width: 0;
    padding: 16px 20px;
    background: #ffffff;
`;

export const KpiValue = styled.dd`
    margin: 2px 0 0;
    font-family: var(--font-title);
    font-size: 1.75rem;
    font-weight: 600;
    line-height: 1.25;
    font-variant-numeric: tabular-nums;
`;

export const KpiTitle = styled.dd`
    margin: 6px 0 0;
    font-weight: 600;
    line-height: 1.35;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const KpiSub = styled.dd`
    margin: 2px 0 0;
    font-size: 0.8125rem;
    color: var(--color-gray-500);
    font-variant-numeric: tabular-nums;
`;

export const ChartArea = styled.div`
    padding: 16px 20px 8px;
`;

export const ChartHeader = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    column-gap: 12px;
    row-gap: 2px;
    margin-bottom: 4px;
`;

export const ChartTitle = styled.h2`
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
`;

export const ChartHint = styled.p`
    margin: 0;
    font-size: 0.8125rem;
    color: var(--color-gray-500);
`;

export const Empty = styled.div`
    padding: 40px;
    text-align: center;
    color: #666;
`;

export const Slug = styled.span`
    font-size: 0.8125rem;
    color: var(--color-gray-500);
`;

export const Num = styled.span<{ $muted?: boolean }>`
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    color: ${(p) => (p.$muted ? "var(--color-gray-500)" : "inherit")};
`;
