"use client";

import styled from "styled-components";

export const CertificateWrapper = styled.div`
    --ink: #14203b;
    --muted: #5a6680;
    --body: #2c3954;
    --blue: #1a73e8;
    --grid: #e9eef7;
    /* next/font variables on screen; the print iframe falls back to the Google Fonts names */
    --display: var(--ml-font-display, "Space Grotesk"), system-ui, -apple-system, "Segoe UI", sans-serif;
    --mono: var(--ml-font-mono, "JetBrains Mono"), ui-monospace, Consolas, monospace;

    position: relative;
    width: 1009px;
    height: 760px;
    overflow: hidden;
    background: #ffffff;
    color: var(--ink);
    font-family: var(--display);
    line-height: 1.4;

    *,
    *::before,
    *::after {
        box-sizing: border-box;
    }
`;

export const GridPaper = styled.div`
    position: absolute;
    inset: 25px;
    background-image: linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
    background-size: 28px 28px;
    -webkit-mask-image: linear-gradient(90deg, rgb(0 0 0 / 0.3), rgb(0 0 0 / 0.3) 52%, #000 72%);
    mask-image: linear-gradient(90deg, rgb(0 0 0 / 0.3), rgb(0 0 0 / 0.3) 52%, #000 72%);
`;

/** Outer frame with ruler ticks along the top and bottom edges */
export const Frame = styled.div`
    position: absolute;
    inset: 24px;
    border: 1.5px solid var(--ink);

    &::before,
    &::after {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        height: 7px;
        background: repeating-linear-gradient(90deg, var(--ink) 0 1px, transparent 1px 28px);
    }

    &::before {
        top: 0;
    }

    &::after {
        bottom: 0;
    }
`;

// Header

export const Top = styled.div`
    position: absolute;
    top: 58px;
    left: 64px;
    right: 64px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 32px;
`;

export const Lockup = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    flex: none;

    img {
        height: 34px;
        width: auto;
    }

    b {
        display: block;
        font-size: 16px;
        line-height: 1.15;
        font-weight: 700;
    }

    span {
        display: block;
        font-size: 12px;
        color: var(--muted);
    }
`;

export const Meta = styled.div`
    display: grid;
    justify-items: end;
    gap: 2px;
    text-align: right;
    font-family: var(--mono);
    font-size: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);

    span:first-child {
        color: var(--ink);
        font-weight: 600;
    }
`;

// Body

export const Body = styled.div`
    position: absolute;
    top: 166px;
    left: 64px;
    width: 556px;
`;

export const Eyebrow = styled.div`
    font-family: var(--mono);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--blue);
`;

export const Lead = styled.p`
    margin: 26px 0 0;
    font-size: 16px;
    color: var(--muted);
`;

export const RecipientName = styled.h1`
    margin: 6px 0 0;
    font-weight: 700;
    line-height: 1.04;
    letter-spacing: -0.02em;
`;

export const Statement = styled.p`
    margin: 18px 0 0;
    max-width: 540px;
    font-size: 18px;
    line-height: 1.6;
    color: var(--body);
    white-space: pre-line;

    /* Team name and placement */
    code {
        font-family: var(--mono);
        font-size: 15px;
        padding: 2px 8px;
        border-radius: 4px;
        background: #e8f0fe;
        color: #174ea6;
        -webkit-box-decoration-break: clone;
        box-decoration-break: clone;
    }
`;

// Heatmap

export const Heatmap = styled.figure`
    position: absolute;
    top: 112px;
    right: 44px;
    margin: 0;

    svg {
        display: block;
        background: #ffffff;
    }
`;

/** Sized to fit one line under the 319px heatmap */
export const Caption = styled.figcaption`
    margin-top: 8px;
    font-family: var(--mono);
    font-size: 10.5px;
    line-height: 1.5;
    white-space: nowrap;
    color: var(--muted);
`;

// Signatures

/** Stays in the left column (the heatmap fills the right) and fits up to three signatures */
export const Signatures = styled.div`
    position: absolute;
    left: 64px;
    width: 556px;
    bottom: 62px;
    display: flex;
    gap: 32px;
    /* Top-aligned so images and lines stay level when roles wrap to different line counts */
    align-items: flex-start;
`;

export const Signature = styled.div`
    flex: 1 1 0;
    max-width: 200px;
    min-width: 0;
    text-align: center;
`;

export const SignatureImage = styled.div`
    height: 56px;
    display: flex;
    align-items: flex-end;
    justify-content: center;

    img {
        max-height: 100%;
        max-width: 100%;
        object-fit: contain;
    }
`;

export const SignatureLine = styled.div`
    height: 1px;
    margin-top: 6px;
    background: var(--ink);
    opacity: 0.35;
`;

export const SignatureName = styled.div`
    margin-top: 8px;
    font-size: 14px;
    font-weight: 700;
`;

export const SignatureRole = styled.div`
    margin-top: 2px;
    font-size: 12px;
    color: var(--muted);
    text-wrap: balance;
`;
