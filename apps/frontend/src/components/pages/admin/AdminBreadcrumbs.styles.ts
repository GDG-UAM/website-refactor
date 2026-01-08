import styled from "styled-components";

export const Nav = styled.nav`
    width: 100%;
    margin: 4px 0 12px 0;
`;

export const List = styled.ol`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    list-style: none;
    padding: 0;
    margin: 0;
    color: #4b5563;
    font-size: 14px;
`;

export const Crumb = styled.li`
    display: inline-flex;
    align-items: center;
    gap: 6px;

    a {
        color: #2563eb;
        text-decoration: none;
    }
    a:hover {
        text-decoration: underline;
    }
`;

export const Sep = styled.span`
    color: #9ca3af;
`;
