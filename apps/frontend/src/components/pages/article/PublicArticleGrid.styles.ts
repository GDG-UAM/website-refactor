import styled from "styled-components";

export const Controls = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
`;

export const ListContainer = styled.div`
    margin: 0 auto;
    padding: 0;
    max-width: 900px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

export const PageWrapper = styled.div`
    padding: 40px 32px 80px;
    max-width: 1280px;
    margin: 0 auto;
`;

export const HeaderGrid = styled.header`
    display: grid;
    grid-template-columns: 1fr minmax(320px, 640px) 1fr;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;

    > :first-child {
        justify-self: start;
    }
    > :nth-child(2) {
        justify-self: center; /* search always perfectly centered */
    }
    > :last-child {
        justify-self: end;
    }

    @media (max-width: 768px) {
        grid-template-columns: 1fr auto;
        grid-template-rows: auto auto;
        > :nth-child(2) {
            grid-column: 1 / -1;
            order: 3;
            margin-top: 8px;
            justify-self: stretch;
            width: 100%;
        }
    }
`;

export const Title = styled.h1`
    font-size: 2rem;
    font-weight: 800;
    margin: 0;
`;

export const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(275px, 1fr));
    gap: 32px;
    margin-top: 32px;
`;
