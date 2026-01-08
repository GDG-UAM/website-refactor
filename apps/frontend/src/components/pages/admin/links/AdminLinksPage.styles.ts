import styled from "styled-components";

export const Container = styled.div`
    max-width: 1400px;
    margin: 0 auto;
`;

export const Header = styled.div`
    margin-bottom: 24px;
`;

export const Title = styled.h1`
    font-size: 2rem;
    font-weight: 600;
    margin: 0 0 8px 0;
`;

export const LinkDestination = styled.a`
    color: #0066cc;
    text-decoration: none;
    font-size: 0.9rem;
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: inline-block;
    vertical-align: middle;

    &:hover {
        text-decoration: underline;
    }
`;
