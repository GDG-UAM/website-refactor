import styled, { keyframes } from "styled-components";
import type { ToastType } from "./Toast";

const toastColors = {
    success: "var(--toast-success-bg)",
    error: "var(--toast-error-bg)",
    info: "var(--toast-info-bg)"
};

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

export const ToastContainer = styled.div<{ type: ToastType; $isClosing?: boolean }>`
    display: flex;
    align-items: center;
    padding: 10px;
    margin-bottom: 10px;
    border-radius: 8px;
    color: white;
    background-color: color-mix(in srgb, ${({ type }) => toastColors[type]}, transparent 25%);
    border: 3px solid ${({ type }) => toastColors[type]};
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    animation: ${fadeIn} 0.3s ease-in-out;
    max-width: 320px;
    transition: all 0.4s ease-in-out;
    opacity: ${({ $isClosing }) => ($isClosing ? 0 : 1)};
    max-height: ${({ $isClosing }) => ($isClosing ? "0" : "1000px")};
    padding-top: ${({ $isClosing }) => ($isClosing ? 0 : "10px")};
    padding-bottom: ${({ $isClosing }) => ($isClosing ? 0 : "10px")};
    margin-bottom: ${({ $isClosing }) => ($isClosing ? 0 : "10px")};
    overflow: hidden;
`;

export const IconWrapper = styled.div`
    margin-right: 10px;
    font-size: 1.5em;
    display: flex;
    justify-content: center;
`;

export const Message = styled.div`
    font-size: 1em;
    flex-grow: 1;
`;

export const CloseButton = styled.button`
    background: none;
    border: none;
    color: white;
    font-size: 1.2em;
    cursor: pointer;
    margin-left: 10px;
    padding: 5px;
    line-height: 1;
    display: flex;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s ease-in-out;

    &:hover {
        background-color: rgba(0, 0, 0, 0.15);
    }
`;
