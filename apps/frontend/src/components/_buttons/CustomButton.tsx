"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import type { PressEvent as HeroUIPressEvent } from "@heroui/button";
import Tooltip from "@mui/material/Tooltip";
import { useButtonContext } from "./ButtonProvider";
import * as m from "#/paraglide/messages";
import { StyledButton, CustomSpinner, getColor } from "./CustomButton.styles";

export type PressEvent = HeroUIPressEvent;

export const DEFAULT_CONFIRMATION_TIME = 750;
export type CustomButtonColor = "default" | "primary" | "secondary" | "success" | "warning" | "danger";

export interface CustomButtonProps {
    onClick?: (event?: PressEvent) => Promise<void> | void;
    path?: string;
    isPathElement?: boolean;
    id?: string;
    color?: CustomButtonColor;
    ariaLabel?: string;
    tooltip?: React.ReactNode | string;
    disabled?: boolean;
    isLoading?: boolean;
    showSpinner?: boolean;
    confirmationDuration?: number;
    className?: string;
    iconSize?: number;
    viewBox?: string;
    hoverColor?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
    noBackground?: boolean;
    borderRadius?: number;
    hasBorder?: boolean;
    slim?: boolean;
    noHover?: boolean;
    fullWidth?: boolean;
    dontUseContext?: boolean;
    justify?: "center" | "flex-start" | "flex-end" | "space-between" | "space-around";
    type?: "button" | "submit" | "reset";
    showColorDisabled?: boolean;
    noTranslate?: boolean;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
    onClick,
    path,
    isPathElement = false,
    id,
    color = "default",
    ariaLabel,
    tooltip,
    disabled = false,
    isLoading = false,
    showSpinner = false,
    confirmationDuration = 0,
    className,
    iconSize = 24,
    viewBox = "0 -960 960 960",
    hoverColor,
    style,
    noBackground = false,
    borderRadius = 8,
    hasBorder,
    slim = false,
    noHover = false,
    fullWidth = false,
    dontUseContext = false,
    justify = "center",
    showColorDisabled = false,
    noTranslate,
    children = null
}) => {
    const [loading, setLoading] = useState(isLoading);
    const [isHolding, setIsHolding] = useState(false);
    const [holdProgress, setHoldProgress] = useState(0);
    const [showTooltip, setShowTooltip] = useState(false);
    const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { disableAll, setDisableAll } = useButtonContext();
    const disableAllEffective = dontUseContext ? false : disableAll;

    const needsConfirmation = confirmationDuration > 0;

    const endHold = useCallback(() => {
        setIsHolding(false);
        setHoldProgress(0);
        if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
        }
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
    }, []);

    const executeClick = useCallback(
        async (event?: PressEvent) => {
            endHold();
            if (showSpinner) {
                setLoading(true);
            }
            setDisableAll(true);
            try {
                const result = onClick?.(event);
                if (result instanceof Promise) {
                    await result;
                }
            } finally {
                if (showSpinner) {
                    setLoading(false);
                }
                setDisableAll(false);
            }
        },
        [endHold, onClick, showSpinner, setDisableAll]
    );

    const startHold = useCallback(() => {
        if (disabled || loading || disableAllEffective || !needsConfirmation) return;

        setIsHolding(true);
        setHoldProgress(0);

        const startTime = Date.now();
        progressIntervalRef.current = setInterval(() => {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min((elapsedTime / confirmationDuration) * 100, 100);
            setHoldProgress(progress);

            if (progress === 100) {
                clearInterval(progressIntervalRef.current!);
                if (holdTimerRef.current) {
                    clearTimeout(holdTimerRef.current);
                    holdTimerRef.current = null;
                }
                executeClick();
            }
        }, 50);

        holdTimerRef.current = setTimeout(() => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
            }
            if (isHolding) {
                executeClick();
            }
        }, confirmationDuration);
    }, [disabled, loading, disableAllEffective, needsConfirmation, confirmationDuration, isHolding, executeClick]);

    const handlePress = (event?: PressEvent) => {
        if (!needsConfirmation) {
            executeClick(event);
        } else {
            setShowTooltip(true);
            if (tooltipTimeoutRef.current) {
                clearTimeout(tooltipTimeoutRef.current);
            }
            tooltipTimeoutRef.current = setTimeout(() => {
                setShowTooltip(false);
            }, 1000);
        }
    };

    useEffect(() => {
        return () => {
            if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        setLoading(isLoading);
    }, [isLoading]);

    const isActuallyDisabled = disabled || loading || disableAllEffective;
    const buttonColor = getColor(color, isActuallyDisabled);

    const realHasBorder = hasBorder !== undefined ? hasBorder : noBackground;

    const buttonEl = (
        <StyledButton
            id={id}
            isIconOnly={!children}
            aria-label={ariaLabel}
            isDisabled={isActuallyDisabled}
            onPressStart={startHold}
            onPressEnd={endHold}
            onPress={handlePress}
            className={className}
            disableRipple
            iconSize={iconSize}
            viewBox={viewBox}
            style={style}
            $holdProgress={holdProgress}
            $buttonColor={showColorDisabled ? buttonColor : disabled ? "var(--button-disabled-bg)" : buttonColor}
            $hoverColor={hoverColor}
            $noBackground={noBackground}
            $borderRadius={borderRadius}
            $canClick={!!onClick}
            $hasBorder={realHasBorder}
            $isSlim={slim}
            $disableHover={noHover}
            $fullWidth={fullWidth}
            $justify={justify}
            data-no-ai-translate={noTranslate || undefined}
        >
            {loading && showSpinner ? (
                <>
                    <CustomSpinner size={iconSize} color={color} />
                    {children}
                </>
            ) : path ? (
                <>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height={`${iconSize}px`}
                        viewBox={viewBox}
                        width={`${iconSize}px`}
                        fill={showColorDisabled ? buttonColor : disabled ? "var(--button-disabled-bg)" : buttonColor}
                    >
                        {isPathElement ? <g dangerouslySetInnerHTML={{ __html: path }} /> : <path d={path} />}
                    </svg>
                    {children}
                </>
            ) : (
                <>{children}</>
            )}
        </StyledButton>
    );

    // Hold-to-confirm tooltip takes precedence. If not active, use provided tooltip when available.
    if (showTooltip || tooltip) {
        const controlledProps = showTooltip ? { open: true } : {};
        return (
            <Tooltip title={showTooltip ? m["buttons.tooltip.keepPressed"]() : (tooltip ?? "")} placement="top" arrow {...controlledProps}>
                {buttonEl}
            </Tooltip>
        );
    }

    return buttonEl;
};
