import styled from "styled-components";

export const Title = styled.h1`
    margin: 0 0 8px 0;
    font-size: 2rem;
    display: flex;
    gap: 16px;
    align-items: center;
    flex-wrap: wrap;
`;

export const FAQSection = styled.div`
    grid-area: faq;
`;

export const FAQTitle = styled.h2`
    font-size: 1.5rem;
    color: var(--google-dark-gray);
`;

export const Intro = styled.p`
    color: var(--google-dark-gray);
    line-height: 1.6;
`;

export const PageContainer = styled.div`
    padding: 40px 32px 80px;
    max-width: 1280px;
    margin: 0 auto;
`;

export const Grid = styled.div`
    display: grid;
    gap: 32px;
    align-items: start;
    position: relative;

    grid-template-columns: 1fr clamp(320px, 45vw, 500px);
    grid-template-rows: min-content auto;
    grid-template-areas:
        "left ."
        "faq .";

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        grid-template-rows: auto;
        grid-template-areas:
            "left"
            "right"
            "faq";
    }
`;

export const Left = styled.div`
    grid-area: left;
    max-width: 700px;
`;

export const RightWrapper = styled.div`
    width: clamp(320px, 45vw, 500px);
    position: absolute;
    right: 0;
    top: 0;

    @media (max-width: 768px) {
        position: static;
        grid-area: right;
        width: 100%;
        max-width: 500px;
        margin: 0 auto;
    }
`;
