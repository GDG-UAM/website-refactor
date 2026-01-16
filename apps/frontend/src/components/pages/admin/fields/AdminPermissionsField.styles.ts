import styled from "styled-components";

export const PermissionsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 8px;
`;

export const PermissionRuleItem = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    background: #fff;
    border-radius: 12px;
    border: 1px solid #e9ecef;
    transition: all 0.2s;

    &:hover {
        background: var(--google-super-light-gray);
    }
`;

export const RuleInfo = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

export const RuleTitle = styled.span`
    font-weight: 700;
    font-size: 0.875rem;
    color: #1a1a1a;
    font-family: var(--font-mono);
`;

export const BadgeRow = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
`;

export const ActionBadge = styled.div`
    background: #e7f5ff;
    color: #1971c2;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 700;
    transition: all 0.2s;

    ${PermissionRuleItem}:hover & {
        background: #d0ebff;
        color: #1864ab;
    }
`;

export const EffectBadge = styled.div<{ $allow?: boolean }>`
    background: ${(props) => (props.$allow ? "#ebfbee" : "#fff5f5")};
    color: ${(props) => (props.$allow ? "#2b8a3e" : "#fa5252")};
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 700;
    transition: all 0.2s;

    ${PermissionRuleItem}:hover & {
        background: ${(props) => (props.$allow ? "#d3f9d8" : "#ffe3e3")};
        color: ${(props) => (props.$allow ? "#237031" : "#e03131")};
    }
`;

export const ConditionText = styled.span`
    font-size: 0.75rem;
    color: #868e96;
    font-family: var(--font-mono);
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const ActionRow = styled.div`
    display: flex;
    gap: 8px;

    @media (max-width: 640px) {
        display: none;
    }
`;

export const MobileActionTrigger = styled.div`
    display: none;

    @media (max-width: 640px) {
        display: block;
    }
`;

export const MobileButtonList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 8px 0;
`;

export const EmptyState = styled.div`
    padding: 32px;
    text-align: center;
    color: #666;
    font-size: 0.875rem;
    border: 1px dashed #e0e0e0;
    border-radius: 12px;
`;

export const ModalFieldWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 20px;
`;

export const ModalRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;

    @media (max-width: 600px) {
        grid-template-columns: 1fr;
    }
`;

export const EffectToggleGroup = styled.div`
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
`;

export const ModalSubHeading = styled.div`
    font-size: 0.875rem;
    font-weight: 700;
    margin-bottom: 8px;
    color: #1a1a1a;
`;

export const ModalCaption = styled.div`
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #868e96;
`;

export const FlexBox = styled.div<{
    $gap?: number | string;
    $flexWrap?: string;
    $alignItems?: string;
    $mt?: number;
    $p?: number;
    $borderRadius?: number;
    $bgcolor?: string;
    $border?: string;
    $direction?: "row" | "column";
}>`
    display: flex;
    flex-direction: ${(props) => props.$direction || "row"};
    gap: ${(props) => (typeof props.$gap === "number" ? `${props.$gap * 8}px` : props.$gap || "0")};
    flex-wrap: ${(props) => props.$flexWrap || "nowrap"};
    align-items: ${(props) => props.$alignItems || "stretch"};
    margin-top: ${(props) => (props.$mt ? `${props.$mt * 8}px` : "0")};
    margin-bottom: ${(props) => (props.className?.includes("mb-1") ? "8px" : "0")};
    padding: ${(props) => (props.$p ? `${props.$p * 8}px` : "0")};
    border-radius: ${(props) => (props.$borderRadius ? `${props.$borderRadius * 8}px` : "0")};
    background: ${(props) => props.$bgcolor || "transparent"};
    border: ${(props) => props.$border || "none"};
`;

export const MonoText = styled.div`
    font-family: var(--font-mono);
    font-size: 0.9rem;
    color: #1971c2;
    font-weight: 700;
`;

export const Stack = styled.div<{ $spacing?: number; $pl?: number; $direction?: "row" | "column" }>`
    display: flex;
    flex-direction: ${(props) => props.$direction || "column"};
    gap: ${(props) => (props.$spacing ? `${props.$spacing * 8}px` : "0")};
    padding-left: ${(props) => (props.$pl ? `${props.$pl * 8}px` : "0")};
`;
