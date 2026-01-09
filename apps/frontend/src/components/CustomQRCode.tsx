"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import Image from "next/image";
import { QRWrapper, InnerQR, CornerTL, CornerTR, CornerBL, CornerBR, LogoContainer } from "./CustomQRCode.styles";

interface CustomQRCodeProps {
    value: string;
    size?: number;
    cornerSize?: number;
    cornerColor?: string;
    logoUrl?: string;
    logoSize?: number; // percentage of total size, e.g. 20
    className?: string;
}

export const CustomQRCode: React.FC<CustomQRCodeProps> = ({ value, size = 300, cornerSize = 100, cornerColor, logoUrl, logoSize = 25, className }) => {
    const [modules, setModules] = useState<{ data: Uint8Array; size: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!value) return;
        setLoading(true);

        try {
            const qr = QRCode.create(value, { errorCorrectionLevel: "H" });
            setModules({
                data: qr.modules.data,
                size: qr.modules.size
            });
        } catch (err) {
            console.error("Failed to generate QR modules", err);
        } finally {
            setLoading(false);
        }
    }, [value]);

    const calculatedLogoSize = (size * logoSize) / 100;
    const cellSize = modules ? size / modules.size : 0;

    const renderDots = () => {
        if (!modules) return null;
        let pathData = "";
        const { size: qrSize, data } = modules;

        const isDark = (r: number, c: number) => {
            if (r < 0 || r >= qrSize || c < 0 || c >= qrSize) return false;
            return !!data[r * qrSize + c];
        };

        for (let row = 0; row < qrSize; row++) {
            for (let col = 0; col < qrSize; col++) {
                if (isDark(row, col)) {
                    const x = col * cellSize;
                    const y = row * cellSize;
                    const r = cellSize * 0.5; // perfectly rounded

                    // Neighbor checks
                    const top = isDark(row - 1, col);
                    const bottom = isDark(row + 1, col);
                    const left = isDark(row, col - 1);
                    const right = isDark(row, col + 1);

                    // Build a path with conditional rounding
                    const tl = !top && !left ? r : 0;
                    const tr = !top && !right ? r : 0;
                    const bl = !bottom && !left ? r : 0;
                    const br = !bottom && !right ? r : 0;

                    pathData += `
            M ${x + tl},${y}
            H ${x + cellSize - tr}
            ${tr ? `A ${tr},${tr} 0 0 1 ${x + cellSize},${y + tr}` : ""}
            V ${y + cellSize - br}
            ${br ? `A ${br},${br} 0 0 1 ${x + cellSize - br},${y + cellSize}` : ""}
            H ${x + bl}
            ${bl ? `A ${bl},${bl} 0 0 1 ${x},${y + cellSize - bl}` : ""}
            V ${y + tl}
            ${tl ? `A ${tl},${tl} 0 0 1 ${x + tl},${y}` : ""}
            Z
          `.replace(/\s+/g, " ");
                }
            }
        }

        return (
            <path
                d={pathData}
                fill="black"
                stroke="black"
                strokeWidth={0.2} // Eliminates subpixel gaps
                strokeLinejoin="round"
            />
        );
    };

    return (
        <QRWrapper className={className}>
            {!loading && (
                <>
                    <CornerTL $qrCornerSize={cornerSize} $color={cornerColor} />
                    <CornerTR $qrCornerSize={cornerSize} $color={cornerColor} />
                    <CornerBL $qrCornerSize={cornerSize} $color={cornerColor} />
                    <CornerBR $qrCornerSize={cornerSize} $color={cornerColor} />
                </>
            )}
            <InnerQR>
                {loading ? (
                    <div
                        style={{
                            width: size,
                            height: size,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#6b7280"
                        }}
                    >
                        ...
                    </div>
                ) : modules ? (
                    <div style={{ position: "relative", width: size, height: size }}>
                        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
                            <rect width={size} height={size} fill="white" />
                            {renderDots()}
                        </svg>
                        {logoUrl && (
                            <LogoContainer $size={calculatedLogoSize}>
                                <Image src={logoUrl} alt="QR Logo" width={calculatedLogoSize} height={calculatedLogoSize} style={{ objectFit: "contain" }} />
                            </LogoContainer>
                        )}
                    </div>
                ) : (
                    <div
                        style={{
                            width: size,
                            height: size,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        —
                    </div>
                )}
            </InnerQR>
        </QRWrapper>
    );
};
