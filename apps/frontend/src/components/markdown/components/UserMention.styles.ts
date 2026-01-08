import Image from "next/image";
import Link from "next/link";
import styled from "styled-components";

export const Mention = styled.span<{
    $loaded?: boolean;
    $isLink?: boolean;
    $isDotted?: boolean;
    $authorFormat?: boolean;
}>`
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
    color: var(--foreground);
    font-weight: ${({ $authorFormat }) => ($authorFormat ? "600" : "400")};
    ${({ $isLink, $isDotted }) =>
        $isLink &&
        `
    text-decoration: underline;
    text-decoration-style: ${$isDotted ? "dotted" : "solid"};
  `}

    ${({ $loaded }) =>
        !$loaded &&
        `
    color: var(--color-gray-400);
    pointer-events: none;
  `}
`;

export const Avatar = styled(Image)`
    border-radius: 6px;
    object-fit: cover;
    margin: auto;
`;

export const UserLink = styled(Link)`
    border-bottom: none !important;
`;
