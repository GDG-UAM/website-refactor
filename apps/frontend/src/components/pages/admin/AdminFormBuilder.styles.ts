import styled from "styled-components";

export const Form = styled.form`
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 20px;
    width: 100%;
`;

export const FormHeader = styled.div`
    grid-column: span 12;
    margin-bottom: 8px;
`;

export const FormTitle = styled.h1`
    font-size: 2rem;
    font-weight: 600;
    margin: 0 0 8px 0;
`;

export const LockWarning = styled.div`
    color: var(--google-red);
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 4px;
`;

export const FieldWrapper = styled.div<{ $gridColumn?: string }>`
    display: flex;
    flex-direction: column;
    gap: 4px;
    grid-column: ${(props) => props.$gridColumn || "span 12"};

    @media (max-width: 600px) {
        grid-column: span 12 !important;
    }
`;

export const Actions = styled.div`
    display: flex;
    gap: 12px;
    margin-top: 12px;
    grid-column: span 12;

    @media (max-width: 600px) {
        flex-direction: column;
        & > * {
            width: 100%;
        }
    }
`;

export const HelpText = styled.p`
    font-size: 0.75rem;
    color: var(--google-light-gray);
    margin: 0 14px;
`;

export const PreviewContainer = styled.div`
    margin-top: 16px;
    padding: 16px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
`;

export const PreviewTitle = styled.h4`
    margin-top: 0;
    margin-bottom: 12px;
    font-size: 14px;
    color: #374151;
`;

export const SectionDivider = styled.div`
    grid-column: span 12;
    height: 1px;
    background-color: #e5e7eb;
    margin: 10px 0;
`;

export const LocalizedSection = styled.div`
    grid-column: span 12;
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 20px;
`;

export const LocaleSelector = styled.div`
    grid-column: span 12;
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
    align-items: center;
    flex-wrap: wrap;
`;

export const LocaleLabel = styled.span`
    font-size: 0.85rem;
    font-weight: 600;
    color: #6b7280;
    margin-right: 8px;
`;
