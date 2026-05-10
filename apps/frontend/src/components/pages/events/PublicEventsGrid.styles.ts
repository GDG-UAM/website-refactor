import styled from "styled-components";

export const PageWrapper = styled.div`
    padding: 40px 32px 80px;
    max-width: 1280px;
    margin: 0 auto;
`;

export const Header = styled.header`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
`;

export const Title = styled.h1`
    font-size: 2rem;
    font-weight: 800;
    margin: 0;
`;

export const Filters = styled.div`
    display: flex;
    gap: 10px;
`;

export const EventsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(275px, 1fr));
    gap: 32px;
    margin-top: 32px;
`;

export const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    margin-top: 64px;
    text-align: center;

    p {
        font-size: 1.25rem;
        color: var(--text-secondary);
        margin: 0;
    }
`;

