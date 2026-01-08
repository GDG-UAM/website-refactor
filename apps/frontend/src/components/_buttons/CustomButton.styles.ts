import styled, { keyframes } from "styled-components";
import { Button } from "@heroui/button";

export const StyledButton = styled(Button)<{
    iconSize: number;
    $holdProgress: number;
    $buttonColor: string;
    $hoverColor?: string;
    $noBackground?: boolean;
    $borderRadius?: number;
    $canClick: boolean;
    $hasBorder: boolean;
    $isSlim: boolean;
    $disableHover: boolean;
    $fullWidth: boolean;
    $justify: "center" | "flex-start" | "flex-end" | "space-between" | "space-around";
}>`
    background-color: ${({ $noBackground, $buttonColor }) => ($noBackground ? "transparent" : `color-mix(in srgb, ${$buttonColor}, transparent 92.5%)`)};
    min-width: ${({ iconSize }) => iconSize * 2}px;
    ${({ $fullWidth }) => $fullWidth && `width: 100%;`}
    height: fit-content;
    min-height: ${({ $isSlim, iconSize }) => ($isSlim ? iconSize : iconSize * 2)}px;
    color: ${({ $buttonColor }) => $buttonColor};
    gap: ${({ iconSize }) => iconSize / 2}px;
    padding: ${({ $isSlim, iconSize }) => ($isSlim ? `${iconSize / 2.5}px ${iconSize / 2}px` : `${iconSize / 2}px`)};
    border: ${({ $hasBorder, $buttonColor }) => ($hasBorder ? `3px color-mix(in srgb, ${$buttonColor}, transparent 75%) solid` : "none")};
    border-radius: ${({ $borderRadius }) => $borderRadius}px;
    box-sizing: border-box;
    font-weight: 600;
    display: flex;
    justify-content: ${({ $justify }) => $justify};
    align-items: center;
    position: relative;
    overflow: hidden;
    pointer-events: ${({ $canClick }) => ($canClick ? "auto" : "none")};
    transition:
        background-color 0.2s ease-in-out,
        border-radius 0.2s ease-in-out;

    ${({ $disableHover, $noBackground, $buttonColor }) =>
        !$disableHover &&
        `
    &:not(:disabled):hover {
      background-color: ${$noBackground ? `color-mix(in srgb, ${$buttonColor}, transparent 95%)` : `color-mix(in srgb, ${$buttonColor}, transparent 87.5%)`};
    }
  `}

    .nextui-ripple {
        display: none !important;
    }

    & .nextui-button-icon {
        color: currentColor;
    }

    &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: ${({ $holdProgress }) => $holdProgress}%;
        height: 100%;
        background-color: color-mix(in srgb, ${({ $buttonColor }) => $buttonColor}, transparent 75%);
        transition: width 0.1s linear;
        z-index: 1;
    }

    & > svg {
        position: relative;
        z-index: 2;
        transition: fill 0.2s ease-in-out;
    }

    ${({ $disableHover, $hoverColor }) =>
        !$disableHover && $hoverColor
            ? `
        &:hover > svg {
          fill: ${$hoverColor};
          color: ${$hoverColor};
        }
      `
            : ""}
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

export const getColor = (color: string, isDisabled: boolean) => {
    let baseColor;
    switch (color) {
        case "primary":
            baseColor = "var(--button-primary-bg)";
            break;
        case "secondary":
            baseColor = "var(--button-secondary-bg)";
            break;
        case "success":
            baseColor = "var(--button-success-bg)";
            break;
        case "warning":
            baseColor = "var(--button-warning-bg)";
            break;
        case "danger":
            baseColor = "var(--button-danger-bg)";
            break;
        default:
            baseColor = "var(--button-default-bg)";
    }
    return isDisabled ? `color-mix(in srgb, ${baseColor}, transparent 50%)` : baseColor;
};

export const CustomSpinner = styled.div<{ size: number; color: string }>`
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-left-color: ${({ color }) => getColor(color, false)};
    border-radius: 50%;
    box-sizing: border-box;
    width: ${({ size }) => size}px;
    height: ${({ size }) => size}px;
    animation: ${spin} 1s linear infinite;
    position: relative;
    z-index: 2;
`;
