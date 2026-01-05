import styled from "styled-components";
export { LogoContainer, Title, Subtitle } from "#/components/auth/AuthLayout.styles";

export const ButtonContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

export const SignOutButton = styled.button`
    width: 100%;
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    background: var(--auth-logout-button-bg);
    color: var(--auth-logout-button-text);
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: var(--auth-logout-button-bg-hover);
        box-shadow: 0 2px 8px var(--auth-logout-button-shadow);
    }

    &:focus {
        outline: none;
        box-shadow: 0 0 0 2px var(--auth-logout-button-shadow);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;

        &:hover {
            background: var(--auth-logout-button-bg-disabled-hover);
            box-shadow: none;
        }
    }
`;

export const CancelButton = styled.button`
    width: 100%;
    padding: 12px 24px;
    border: 2px solid var(--auth-logout-cancel-button-border);
    border-radius: 8px;
    background: var(--auth-logout-cancel-button-bg);
    color: var(--auth-logout-cancel-button-text);
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        border-color: var(--auth-logout-cancel-button-border-hover);
        color: var(--auth-logout-cancel-button-text-hover);
    }

    &:focus {
        outline: none;
        border-color: var(--auth-logout-cancel-button-border-hover);
        box-shadow: 0 0 0 2px var(--auth-logout-cancel-button-shadow);
    }
`;

export const LoadingSpinner = styled.div`
    width: 20px;
    height: 20px;
    border: 2px solid var(--auth-logout-loading-spinner-border);
    border-top: 2px solid var(--auth-logout-loading-spinner-border-top);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto;

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
`;

export const LoadingSpinnerContainer = styled.div`
    display: flex;
    justify-content: center;
    margin: 32px 0;
`;

export const UserInfo = styled.div`
    background: var(--auth-logout-user-info-bg);
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
`;

export const UserTextInfo = styled.div`
    flex: 1;
`;

export const UserName = styled.div`
    font-weight: 500;
    color: var(--auth-logout-user-info-name-text);
    margin-bottom: 4px;
`;

export const UserEmail = styled.div`
    font-size: 14px;
    color: var(--auth-logout-user-info-email-text);
`;
