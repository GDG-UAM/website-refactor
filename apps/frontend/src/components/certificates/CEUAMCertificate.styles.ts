"use client";

import styled from "styled-components";

// Design Constants

// CEUAM brand color and paper background
// --ceuam: #0d7377 (teal)
// --paper: #f6faf9 (light mint)

// Main Container

export const CertificateWrapper = styled.div`
    /* CSS Custom Properties */
    --ceuam: #0d7377;
    --paper: #f6faf9;
    --font-title: "Montserrat", "Poppins", system-ui, -apple-system, "Segoe UI", Roboto, Arial;
    --font-body: "Montserrat", system-ui, -apple-system, "Segoe UI", Roboto, Arial;

    /* Layout */
    position: relative;
    width: 1009px;
    height: 760px;
    overflow: hidden;

    /* Appearance */
    background: var(--paper);
    font-family: var(--font-body);
`;

// Border & Frame

export const BorderFrame = styled.div`
    position: absolute;
    inset: 18px;
    border: 3px solid var(--ceuam);
    pointer-events: none;

    /* Inner decorative border */
    &::after {
        content: "";
        position: absolute;
        inset: 10px;
        border: 1px solid rgba(13, 115, 119, 0.22);
    }
`;

// Decorative Elements

export const DecorationClip = styled.div`
    position: absolute;
    inset: 18px;
    overflow: hidden;
    pointer-events: none;
`;

export const DecorationContainer = styled.div`
    position: absolute;
    inset: 0;

    /* Radial mask to fade decoration near center content */
    -webkit-mask-image: radial-gradient(circle at 50% 42%, rgba(0, 0, 0, 0) 0 285px, rgba(0, 0, 0, 1) 435px);
    mask-image: radial-gradient(circle at 50% 42%, rgba(0, 0, 0, 0) 0 285px, rgba(0, 0, 0, 1) 435px);

    /* Corner positioning */
    .corner {
        position: absolute;
    }

    .corner svg {
        display: block;
    }

    .corner-tl {
        top: -80px;
        left: -80px;
    }

    .corner-tr {
        top: -70px;
        right: -110px;
        opacity: 0.95;
    }

    .corner-bl {
        bottom: -120px;
        left: -120px;
        opacity: 0.95;
    }

    .corner-br {
        right: -95px;
        bottom: -105px;
    }

    /* Dot grid decoration */
    .dots {
        position: absolute;
        display: grid;
        grid-template-columns: repeat(6, 10px);
        gap: 8px;
        opacity: 0.5;
    }

    .dots-tl {
        left: 125px;
        top: 155px;
    }

    .dots-br {
        right: 170px;
        bottom: 165px;
    }

    .dot {
        width: 4px;
        height: 4px;
        border-radius: 999px;
        background: rgba(13, 115, 119, 0.18);
    }

    .dot-google {
        background: var(--dot, rgba(13, 115, 119, 0.18));
    }
`;

// Content Layer

export const ContentLayer = styled.div`
    position: absolute;
    inset: 18px;
    padding: 54px 70px 46px 70px;

    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
`;

// Header

export const HeaderLogos = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 18px;
    margin-bottom: 22px;

    img {
        height: 40px;
        width: auto;
        object-fit: contain;
    }

    .divider {
        width: 1px;
        height: 34px;
        background: rgba(13, 115, 119, 0.28);
    }
`;

// Typography

export const MainTitle = styled.h1`
    margin: 6px 0 10px 0;
    font-family: var(--font-title);
    font-size: 40px;
    font-weight: 800;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--ceuam);
`;

export const SubTitle = styled.h2`
    margin: 0;
    font-family: var(--font-title);
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #111;
`;

export const DateDisplay = styled.div`
    margin-top: 10px;
    font-size: 13px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(17, 17, 17, 0.62);
`;

export const AwardText = styled.div`
    margin-top: 20px;
    font-size: 14px;
    font-style: italic;
    color: rgba(17, 17, 17, 0.58);
`;

export const RecipientName = styled.div`
    margin-top: 10px;
    font-family: var(--font-title);
    font-size: 52px;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ceuam);
`;

export const Description = styled.p`
    margin: 14px 0 0 0;
    max-width: 720px;
    font-size: 13px;
    line-height: 1.5;
    color: rgba(17, 17, 17, 0.66);
    white-space: pre-line;
    flex-shrink: 0;
`;

// Metadata

export const MetadataGrid = styled.div`
    margin-top: 18px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 24px;
    width: 100%;
`;

export const MetadataItem = styled.div`
    display: inline-flex;
    align-items: baseline;
    gap: 10px;
    padding: 8px 16px;
    border-radius: 10px;
    background: rgba(13, 115, 119, 0.035);
    border: 1px solid rgba(13, 115, 119, 0.18);

    .label {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: rgba(13, 115, 119, 0.92);
    }

    .value {
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.04em;
        color: rgba(17, 17, 17, 0.78);
    }
`;

// Footer & Signatures

export const Footer = styled.div`
    margin-top: auto;
    width: 100%;
    display: flex;
    justify-content: center;
    gap: 40px;
    padding-top: 20px;
    flex-shrink: 1;
    min-height: 0;
`;

export const SignatureBox = styled.div`
    flex: 1;
    max-width: 280px;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 0;
    flex-shrink: 1;
`;

export const SignatureImg = styled.img`
    height: 58px;
    min-height: 40px;
    width: auto;
    object-fit: contain;
    flex-shrink: 1;
`;

export const SignatureLine = styled.div`
    width: 100%;
    height: 1px;
    margin-top: 8px;
    background: rgba(17, 17, 17, 0.25);
`;

export const SignatureName = styled.div`
    margin-top: 10px;
    font-size: 17px;
    font-weight: 800;
    color: #111;
`;

export const SignatureRole = styled.div`
    margin-top: 3px;
    font-size: 14px;
    color: rgba(17, 17, 17, 0.62);
`;
