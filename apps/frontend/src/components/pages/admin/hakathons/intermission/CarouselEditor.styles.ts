import styled from "styled-components";
import { CarouselElementType } from "./IntermissionForm.types";

export const EditorContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 24px;
`;

export const SlideConfigRow = styled.div`
    display: flex;
    gap: 16px;
    align-items: center;

    @media (max-width: 600px) {
        flex-direction: column;
        align-items: stretch;
    }
`;

export const MainGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;

    @media (max-width: 900px) {
        grid-template-columns: 1fr;
    }
`;

export const LayoutTreePanel = styled.div`
    padding: 16px;
    // max-height: 600px;
    overflow-y: auto;
    overflow-x: auto;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #fff;
`;

export const PropertyPanel = styled.div`
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #fff;
    position: sticky;
    top: 0;
`;

export const PanelTitle = styled.h3`
    font-size: 0.875rem;
    font-weight: 600;
    margin: 0;
    color: #333;
`;

export const PanelDivider = styled.hr`
    border: 0;
    border-top: 1px solid #eee;
    margin: 0;
`;

export const TreeItem = styled.div<{ $selected?: boolean; $depth: number }>`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    margin-left: ${(props) => props.$depth * 28}px;
    background: ${(props) => (props.$selected ? "rgba(25, 118, 210, 0.08)" : "transparent")};
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid ${(props) => (props.$selected ? "rgba(25, 118, 210, 0.3)" : "transparent")};
    width: fit-content;
    min-width: 100%;
    box-sizing: border-box;

    &:hover {
        background: ${(props) => (props.$selected ? "rgba(25, 118, 210, 0.12)" : "rgba(0, 0, 0, 0.04)")};
    }
`;

export const ElementTypeIcon = styled.div<{ $type: CarouselElementType }>`
    width: 32px;
    height: 32px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    flex-shrink: 0;
    background: ${(props) => {
        switch (props.$type) {
            case "container":
                return "#e3f2fd";
            case "text":
                return "#f3e5f5";
            case "qr":
                return "#e8f5e9";
            case "image":
                return "#fff3e0";
            case "spacer":
                return "#f5f5f5";
            default:
                return "#eee";
        }
    }};
    color: ${(props) => {
        switch (props.$type) {
            case "container":
                return "#1976d2";
            case "text":
                return "#7b1fa2";
            case "qr":
                return "#2e7d32";
            case "image":
                return "#ef6c00";
            case "spacer":
                return "#616161";
            default:
                return "#333";
        }
    }};
`;

export const ElementContent = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

export const ElementTitle = styled.span`
    font-weight: 600;
    font-size: 0.875rem;
    color: #1a1a1a;
`;

export const ElementSub = styled.span`
    font-size: 0.75rem;
    color: #666;
    white-space: nowrap;
`;

export const ActionBox = styled.div`
    display: flex;
    gap: 4px;
    opacity: 0.4;
    transition: opacity 0.2s;

    ${TreeItem}:hover & {
        opacity: 1;
    }
`;

export const PropSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

export const PropRow = styled.div`
    display: flex;
    gap: 16px;
    & > * {
        flex: 1;
    }
`;

export const HelperText = styled.p`
    font-size: 0.75rem;
    color: #666;
    margin: 4px 0 0 0;
`;

export const AddButtonsRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
`;

export const SmallLabel = styled.span`
    font-size: 0.75rem;
    font-weight: 600;
    color: #666;
    display: block;
`;
