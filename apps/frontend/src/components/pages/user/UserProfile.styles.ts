import styled from "styled-components";

export const PageContainer = styled.section`
    padding: 40px 32px 80px;
    max-width: 1200px;
    margin: 0 auto;
    height: 100%;
`;

export const HeaderWrap = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;

    @media (min-width: 768px) {
        flex-direction: row;
        align-items: flex-start;
    }
`;

export const AvatarBox = styled.div`
    width: 96px;
    height: 96px;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid var(--color-gray-200);
    flex-shrink: 0;
`;

export const Content = styled.div`
    flex: 1;
`;

export const Name = styled.h1`
    margin: 0;
    font-size: 2rem;
    line-height: 1.2;
    font-weight: 800;
    color: var(--google-dark-gray);

    @media (max-width: 768px) {
        text-align: center;
    }
`;

export const NameRow = styled.div`
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;

    @media (max-width: 768px) {
        justify-content: center;
        text-align: center;
        flex-direction: column-reverse;
        gap: 4px;
        margin-top: -4px;
    }
`;

export const Bio = styled.p`
    margin-top: 12px;
    color: var(--google-light-gray);
    max-width: 65ch;
    white-space: pre-wrap; /* Respect newlines */
`;

export const TagsRow = styled.div`
    margin-top: 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;

    @media (max-width: 768px) {
        justify-content: center;
    }
`;

export const Tag = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--google-red);
    font-size: 0.9rem;
    font-weight: 600;
    border: 2px solid var(--google-red);
    border-radius: 1000px;
    padding: 4px 12px;

    svg {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
    }
`;

export const SocialRow = styled.div`
    margin-top: 12px;
    margin-bottom: 16px;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    @media (max-width: 768px) {
        justify-content: center;
    }
`;

export const PrivateBadge = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 2px;
    color: var(--google-red);
    font-size: 0.95rem;
    font-weight: 600;
    border: 2px solid var(--google-red);
    border-radius: 1000px;
    padding: 3px 8px;
`;
