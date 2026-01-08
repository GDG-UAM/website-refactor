import styled, { css, keyframes } from "styled-components";

export const Card = styled.div<{ $skeleton?: boolean }>`
    background-color: var(--color-white);
    border-radius: 8px;
    transition:
        background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1),
        box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    max-width: 350px;
    min-width: 275px;
    height: 100%;
    cursor: ${({ $skeleton }) => ($skeleton ? "default" : "pointer")};
    position: relative;
    padding: 0;
    margin: auto;
    border: 1px var(--color-gray-200) solid;
    width: 100%;

    ${({ $skeleton }) =>
        !$skeleton &&
        css`
            &:hover {
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15) !important;
            }
        `}
`;

export const ImageWrapper = styled.div<{ $skeleton?: boolean }>`
    width: 100%;
    height: 150px;
    position: relative;
    overflow: hidden;
    margin: 0;
    padding: 0;
    flex-shrink: 0;
    img {
        object-fit: cover;
        width: 100%;
        height: 100%;
    }
    ${({ $skeleton }) =>
        $skeleton &&
        css`
            background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
            background-size: 400% 100%;
            animation: ${shimmer} 1.4s ease infinite;
        `}
`;

const shimmer = keyframes`
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
`;

export const Content = styled.div`
    padding: 16px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: 8px;
    background: transparent;
    margin: 0;
    border-radius: 0 0 32px 32px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    height: 100%;
`;

export const Title = styled.h3<{ $skeleton?: boolean }>`
    font-size: 1.3rem;
    font-weight: 600;
    margin: 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    transition: color 0.3s ease;
    padding: 0;
    overflow: hidden;
    ${({ $skeleton }) =>
        $skeleton &&
        css`
            display: grid;
            grid-template-rows: 1fr 1fr;
            gap: 6px;
            -webkit-line-clamp: unset;
            -webkit-box-orient: unset;
            > div {
                height: 22px;
                border-radius: 6px;
                background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
                background-size: 400% 100%;
                animation: ${shimmer} 1.4s ease infinite;
            }
            > div:first-child {
                width: 90%;
            }
            > div:last-child {
                width: 70%;
            }
            color: transparent;
        `}
`;

export const Meta = styled.div<{ $skeleton?: boolean }>`
    display: flex;
    color: var(--color-gray-500);
    font-size: 0.9rem;
    margin-top: 2px;
    font-weight: 400;
    transition: color 0.3s ease;
    padding: 0;
    gap: 8px;
    ${({ $skeleton }) =>
        $skeleton &&
        css`
            display: grid;
            gap: 6px;
            -webkit-line-clamp: unset;
            -webkit-box-orient: unset;
            > div {
                height: 18px;
                border-radius: 6px;
                background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
                background-size: 400% 100%;
                animation: ${shimmer} 1.4s ease infinite;
            }
            color: transparent;
        `}
`;

export const ShareButtonWrapper = styled.div<{ $iconSize?: number }>`
    position: absolute;
    top: 4px;
    right: 4px;
    width: ${({ $iconSize }) => ($iconSize || 24) * 2}px;
    height: ${({ $iconSize }) => ($iconSize || 24) * 2}px;
    background: var(--color-white);
    border: 2px solid var(--color-gray-300);
    border-radius: 5px;
    z-index: 10;
    padding: 0;
`;
