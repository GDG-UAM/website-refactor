import styled from "styled-components";

export const ErrorContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background: var(--global-error-bg);
    color: var(--global-error-text);
`;

export const ErrorTitle = styled.h1`
    font-size: 2rem;
    margin-bottom: 1rem;
`;

export const ErrorMessage = styled.p`
    font-size: 1.2rem;
`;
