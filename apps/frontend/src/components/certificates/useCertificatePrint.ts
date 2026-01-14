"use client";

import { useCallback, useRef } from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ServerStyleSheet } from "styled-components";
import { CertificateData } from "./types";

// ============================================================================
// Types
// ============================================================================

interface PrintOptions {
    title?: string;
    onBeforePrint?: () => void;
    onAfterPrint?: () => void;
}

interface CertificateComponentProps {
    data: CertificateData;
}

// ============================================================================
// Constants
// ============================================================================

const IFRAME_STYLES = `
    position: fixed;
    top: -10000px;
    left: -10000px;
    width: 1px;
    height: 1px;
    border: none;
    visibility: hidden;
`;

const FONT_LOAD_DELAY_MS = 250;

// ============================================================================
// Hook
// ============================================================================

/**
 * Custom hook to handle certificate printing.
 * Uses a hidden iframe to render the certificate with all its styles
 * and trigger the browser's print dialog.
 *
 * @returns Object containing print and cleanup functions
 */
export function useCertificatePrint() {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);

    /**
     * Generates the HTML document for printing
     */
    const generatePrintDocument = (html: string, styleTags: string, title: string): string => `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${title}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
            ${styleTags}
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }

                html, body {
                    width: 100%;
                    height: 100%;
                    margin: 0;
                    padding: 0;
                    background: white;
                }

                body {
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                }

                @page {
                    size: landscape;
                    margin: 0;
                }

                @media print {
                    html, body {
                        width: 100%;
                        height: 100%;
                    }

                    body > * {
                        page-break-inside: avoid;
                    }
                }
            </style>
        </head>
        <body>
            ${html}
        </body>
        </html>
    `;

    /**
     * Creates or reuses the hidden iframe for printing
     */
    const getOrCreateIframe = (): HTMLIFrameElement => {
        if (!iframeRef.current) {
            iframeRef.current = document.createElement("iframe");
            iframeRef.current.style.cssText = IFRAME_STYLES;
            document.body.appendChild(iframeRef.current);
        }
        return iframeRef.current;
    };

    /**
     * Triggers the print dialog after fonts are loaded
     */
    const triggerPrint = (iframeWindow: Window, iframeDoc: Document, onBeforePrint?: () => void, onAfterPrint?: () => void) => {
        const handleAfterPrint = () => {
            onAfterPrint?.();
            iframeWindow.removeEventListener("afterprint", handleAfterPrint);
        };

        iframeWindow.addEventListener("afterprint", handleAfterPrint);

        setTimeout(() => {
            onBeforePrint?.();

            // Wait for fonts to be ready before printing
            if (iframeDoc.fonts?.ready) {
                iframeDoc.fonts.ready.then(() => {
                    iframeWindow.focus();
                    iframeWindow.print();
                });
            } else {
                iframeWindow.focus();
                iframeWindow.print();
            }
        }, FONT_LOAD_DELAY_MS);
    };

    /**
     * Prints a certificate component
     */
    const print = useCallback((CertificateComponent: React.ComponentType<CertificateComponentProps>, data: CertificateData, options?: PrintOptions) => {
        const { title = "Certificate", onBeforePrint, onAfterPrint } = options || {};
        const sheet = new ServerStyleSheet();

        try {
            // Render certificate to static HTML with styles
            const certificateElement = createElement(CertificateComponent, { data });
            const html = renderToStaticMarkup(sheet.collectStyles(certificateElement));
            const styleTags = sheet.getStyleTags();

            const iframe = getOrCreateIframe();
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            const iframeWindow = iframe.contentWindow;

            if (!iframeDoc || !iframeWindow) {
                console.error("Could not access iframe document or window");
                return;
            }

            // Write the print document
            const printContent = generatePrintDocument(html, styleTags, title);
            iframeDoc.open();
            iframeDoc.write(printContent);
            iframeDoc.close();

            // Trigger print after fonts load
            triggerPrint(iframeWindow, iframeDoc, onBeforePrint, onAfterPrint);
        } catch (error) {
            console.error("Error printing certificate:", error);
        } finally {
            sheet.seal();
        }
    }, []);

    /**
     * Cleans up the iframe element from the DOM
     */
    const cleanup = useCallback(() => {
        if (iframeRef.current?.parentNode) {
            iframeRef.current.parentNode.removeChild(iframeRef.current);
            iframeRef.current = null;
        }
    }, []);

    return { print, cleanup };
}
