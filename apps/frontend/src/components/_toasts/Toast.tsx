"use client";

import React, { useEffect, useCallback } from "react";
import { ToastContainer, IconWrapper, Message, CloseButton } from "./Toast.styles";

export type ToastType = "success" | "error" | "info";

export interface ToastProps {
    id: number;
    message: string;
    type: ToastType;
    onClose: (id: number) => void;
    isClosing?: boolean;
}

const iconPaths = {
    success:
        "m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z",
    error: "M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z",
    info: "M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z",
    close: "m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"
};

// Reusable SVG icon component
interface ToastIconProps {
    type: keyof typeof iconPaths;
    size?: number;
}

const ToastIcon: React.FC<ToastIconProps> = ({ type, size = 24 }) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" height={`${size}px`} viewBox="0 -960 960 960" width={`${size}px`} fill="currentColor">
            <path d={iconPaths[type]} />
        </svg>
    );
};

const Toast: React.FC<ToastProps> = ({ id, message, type, onClose, isClosing }) => {
    const handleClose = useCallback(() => {
        onClose(id);
    }, [id, onClose]);

    useEffect(() => {
        const timer = setTimeout(handleClose, 5000);
        return () => clearTimeout(timer);
    }, [handleClose]);

    return (
        <ToastContainer type={type} $isClosing={isClosing}>
            <IconWrapper>
                <ToastIcon type={type} />
            </IconWrapper>
            <Message>{message}</Message>
            <CloseButton onClick={handleClose}>
                <ToastIcon type="close" />
            </CloseButton>
        </ToastContainer>
    );
};

export default Toast;
