import styled, { keyframes } from "styled-components";

export const PageContainer = styled.section`
    padding: 40px 32px 80px;
    max-width: min(900px, calc(100vw - 76px));
    width: 100%;
    margin: 0 auto;
    position: relative;
`;

export const Title = styled.h1`
    font-size: 2rem;
    font-weight: 800;
    line-height: 1.2;
    margin-bottom: 8px;
`;

export const Meta = styled.div`
    color: #6b7280;
    margin-bottom: 16px;
`;

export const ImageWrap = styled.div`
    display: flex;
    width: 100%;
    max-height: 360px;
    margin-bottom: 16px;
    border-radius: 12px;
    overflow: hidden;
`;
