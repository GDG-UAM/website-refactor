import styled from "styled-components";

export const FieldContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
`;

export const FieldLabel = styled.h2<{ $disabled?: boolean }>`
    font-size: 1.5rem;
    font-weight: 700;
    color: ${(props) => (props.$disabled ? "#9ca3af" : "#1a1a1a")};
    margin: 0;
`;

export const FieldHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
`;

export const FieldTableWrapper = styled.div`
    overflow-x: auto;
    overflow-y: auto;
    max-height: 480px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
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

export const FieldTable = styled.table<{ $disabled?: boolean }>`
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 0.875rem;

    th,
    td {
        padding: 10px 6px;
        border-bottom: 1px solid #f3f4f6;
    }

    th {
        position: sticky;
        top: 0;
        z-index: 10;
        text-align: left;
        border-bottom-width: 2px;
        white-space: nowrap;
        background: ${(props) => (props.$disabled ? "#f9fafb" : "var(--markdown-thead-bg, var(--color-gray-100))")};
        color: ${(props) => (props.$disabled ? "#9ca3af" : "inherit")};
    }

    @media (max-width: 768px) {
        min-width: 700px;
    }
`;

export const ActionRow = styled.div`
    display: flex;
    gap: 4px;
`;

export const EmptyState = styled.div`
    padding: 24px;
    text-align: center;
    color: #666;
    font-size: 0.875rem;
`;
