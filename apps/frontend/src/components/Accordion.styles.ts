import styled from "styled-components";

export const Item = styled.div`
    border-radius: 12px;
    background: var(--color-white);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
    overflow: hidden;
`;

export const Header = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    text-align: left;
    padding: 14px 16px;
    cursor: pointer;
    background: transparent;
    border: none;

    &:focus {
        outline: none;
    }
`;

export const Title = styled.div`
    color: var(--google-blue);
    font-weight: 600;
`;

export const PanelWrapper = styled.div<{ $open: boolean }>`
    display: grid;
    grid-template-rows: ${({ $open }) => ($open ? "1fr" : "0fr")};
    transition: grid-template-rows 0.28s ease;
`;

export const PanelContent = styled.div<{ $open: boolean }>`
    overflow: hidden;
    padding: ${({ $open }) => ($open ? "12px 16px 18px 16px" : "0 16px")};
    transition: padding 0.28s ease;
    color: var(--google-dark-gray);
    background: transparent;
    border-top: ${({ $open }) => ($open ? "1px solid var(--color-gray-200)" : "1px solid transparent")};
`;

export const Chevron = styled.span<{ $open: boolean }>`
    display: inline-block;
    transform: rotate(${({ $open }) => ($open ? "180deg" : "0deg")});
    transition: transform 0.18s ease;
`;
