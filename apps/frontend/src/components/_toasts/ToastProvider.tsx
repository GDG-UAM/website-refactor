"use client";

import React, { useState, useCallback, useEffect } from "react";
import { ToastContext, ToastType } from "./ToastContext";
import Toast, { ToastProps } from "./Toast";
import { toastEmitter } from "./toastEmitter";

interface ToastState extends Omit<ToastProps, "onClose"> {
    id: number;
    isClosing?: boolean;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastState[]>([]);

    const addToast = useCallback((message: string, type: ToastType) => {
        const id = Date.now();
        setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
    }, []);

    // Listen for toast events
    useEffect(() => {
        const handleToastEvent = (event: CustomEvent) => {
            const { message, type } = event.detail;
            addToast(message, type);
        };

        toastEmitter.addEventListener("toast", handleToastEvent as EventListener);

        return () => {
            toastEmitter.removeEventListener("toast", handleToastEvent as EventListener);
        };
    }, [addToast]);

    const removeToast = useCallback((id: number) => {
        setToasts((prevToasts) => prevToasts.map((toast) => (toast.id === id ? { ...toast, isClosing: true } : toast)));

        setTimeout(() => {
            setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
        }, 400);
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div
                style={{
                    position: "fixed",
                    top: "20px",
                    right: "20px",
                    zIndex: "10000",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end"
                }}
            >
                {toasts.map((toast) => (
                    <Toast key={toast.id} {...toast} onClose={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};
