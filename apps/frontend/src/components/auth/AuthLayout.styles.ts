import styled from "styled-components";

export const AuthContainer = styled.div`
    min-height: 75vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--auth-layout-bg);
    padding: 20px;
`;

export const AuthCard = styled.div`
    background: white;
    border-radius: 12px;
    padding: 48px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    max-width: 420px;
    width: 100%;
    text-align: center;

    @media (max-width: 480px) {
        padding: 32px 24px;
        margin: 16px;
    }
`;

// Shared auth page components
export const LogoContainer = styled.div`
    margin-bottom: 32px;
`;

export const Title = styled.h1<{ $variant?: "login" | "logout" }>`
    font-size: 28px;
    font-weight: 600;
    color: ${(props) => `var(--auth-${props.$variant || "login"}-title-text)`};
    margin-bottom: 8px;
`;

export const Subtitle = styled.p<{ $variant?: "login" | "logout" }>`
    font-size: 16px;
    color: ${(props) => `var(--auth-${props.$variant || "login"}-subtitle-text)`};
    margin-bottom: 32px;
    line-height: 1.5;
`;
