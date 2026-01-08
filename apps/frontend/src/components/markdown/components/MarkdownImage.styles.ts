import styled from "styled-components";
import Image from "next/image";

export const Container = styled.span<{ $aspectRatio?: string }>`
    display: block;
    position: relative;
    width: 100%;
    margin: 1em 0;
    border-radius: 6px;
    overflow: hidden;

    ${({ $aspectRatio }) =>
        $aspectRatio &&
        `
    aspect-ratio: ${$aspectRatio};
  `}
`;

export const BlurLayer = styled.div`
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    border-radius: inherit;
    transition: opacity 0.4s ease;
    z-index: 0;
`;

export const ImgLayer = styled(Image)`
    position: absolute !important;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: inherit;
    transition: opacity 0.4s ease;
    z-index: 1;
`;
