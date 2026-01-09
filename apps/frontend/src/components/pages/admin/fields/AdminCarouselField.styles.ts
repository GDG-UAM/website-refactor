import styled from "styled-components";

export const CarouselList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

export const CarouselPreview = styled.div`
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

export const SlideInfo = styled.div<{ $hidden?: boolean }>`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    opacity: ${(props) => (props.$hidden ? 0.5 : 1)};
    filter: ${(props) => (props.$hidden ? "grayscale(100%)" : "none")};
`;

export const SlideTitle = styled.span`
    font-weight: 700;
    font-size: 0.875rem;
    color: #1a1a1a;
`;

export const BadgeRow = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
`;

export const DurationBadge = styled.div`
    background: #e7f5ff;
    color: #1971c2;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 700;
    transition: all 0.2s;

    ${CarouselPreview}:hover & {
        background: #d0ebff;
        color: #1864ab;
    }
`;

export const HiddenText = styled.span`
    font-size: 0.75rem;
    color: #fa5252;
    font-weight: 700;
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
