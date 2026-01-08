import styled from "styled-components";

export const Wrapper = styled.div`
    display: grid;
    gap: 12px;
    padding: 12px;
`;

export const Card = styled.div`
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
`;

export const TableWrapper = styled.div`
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;

    @media (max-width: 768px) {
        &::-webkit-scrollbar {
            height: 8px;
        }
        &::-webkit-scrollbar-track {
            background: #f1f1f1;
        }
        &::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
        }
    }
`;

export const Controls = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    padding: 8px 0;

    @media (max-width: 900px) {
        & > .search-field {
            flex: 1 1 100%;
            margin-left: 0 !important;
        }
    }

    @media (max-width: 640px) {
        & > * {
            flex: 1 1 100%;
            width: 100%;
            min-width: 100% !important;
            margin-left: 0 !important;
        }
    }
`;

export const Table = styled.table`
    width: 100%;
    border-collapse: collapse;

    th,
    td {
        padding: 10px 6px;
        border-bottom: 1px solid #f3f4f6;
    }
    th {
        text-align: left;
        border-bottom-width: 2px;
        white-space: nowrap;
    }

    @media (max-width: 768px) {
        min-width: 700px;
        td {
            white-space: nowrap;
        }
    }
`;

export const Footer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
    font-size: 0.875rem;
    color: #666;
`;

export const PaginationControls = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const RowActions = styled.div`
    display: flex;
    gap: 6px;
    justify-content: flex-end;
    align-items: center;
`;
