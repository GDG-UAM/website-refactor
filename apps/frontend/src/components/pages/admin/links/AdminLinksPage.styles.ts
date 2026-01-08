import styled from "styled-components";

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
