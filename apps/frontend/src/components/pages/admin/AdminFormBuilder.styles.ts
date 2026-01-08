import styled from "styled-components";

export const Form = styled.form`
    display: grid;
    gap: 20px;
    width: 100%;
`;

export const FieldWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

export const Actions = styled.div`
    display: flex;
    gap: 12px;
    margin-top: 12px;

    @media (max-width: 600px) {
        flex-direction: column;
        & > * {
            width: 100%;
        }
    }
`;

export const HelpText = styled.p`
    font-size: 0.8rem;
    color: #666;
    margin: 0;
`;
