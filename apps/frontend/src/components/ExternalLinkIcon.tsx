"use client";

import React, { useLayoutEffect, useRef, useState } from "react";

const PATHS = {
    100: "M226-140q-36.73 0-61.36-24.64Q140-189.27 140-226v-508q0-36.72 24.64-61.36Q189.27-820 226-820h233v54H226q-12 0-22 10t-10 22v508q0 12 10 22t22 10h508q12 0 22-10t10-22v-233h54v233q0 36.73-24.64 61.36Q770.72-140 734-140H226Zm161-209-38-38 379-379H579v-54h241v241h-54v-149L387-349Z",
    200: "M218.62-128q-38.35 0-64.48-26.14Q128-180.27 128-218.62v-522.76q0-38.35 26.14-64.48Q180.27-832 218.62-832h249.61v66H218.62q-9.24 0-16.93 7.69-7.69 7.69-7.69 16.93v522.76q0 9.24 7.69 16.93 7.69 7.69 16.93 7.69h522.76q9.24 0 16.93-7.69 7.69-7.69 7.69-16.93v-249.61h66v249.61q0 38.35-26.14 64.48Q779.73-128 741.38-128H218.62Zm167.92-212.23-46.31-46.31L719.69-766H579v-66h253v253h-66v-140.69L386.54-340.23Z",
    300: "M206.31-108q-41.03 0-69.67-28.64T108-206.31v-547.38q0-41.03 28.64-69.67T206.31-852h277.3v86h-277.3q-4.62 0-8.46 3.85-3.85 3.84-3.85 8.46v547.38q0 4.62 3.85 8.46 3.84 3.85 8.46 3.85h547.38q4.62 0 8.46-3.85 3.85-3.84 3.85-8.46v-277.3h86v277.3q0 41.03-28.64 69.67T753.69-108H206.31Zm179.46-217.62-60.15-60.15L705.85-766H579v-86h273v273h-86v-126.85L385.77-325.62Z",
    400: "M194-88q-43.73 0-74.86-31.14Q88-150.27 88-194v-572q0-43.72 31.14-74.86Q150.27-872 194-872h305v106H194v572h572v-305h106v305q0 43.73-31.14 74.86Q809.72-88 766-88H194Zm191-223-74-74 381-381H579v-106h293v293H766v-113L385-311Z",
    500: "M197.83-84.65q-46.93 0-80.06-33.12-33.12-33.13-33.12-80.06v-564.34q0-46.93 33.12-80.06 33.13-33.12 80.06-33.12h298.3v113.18h-298.3v564.34h564.34v-298.3h113.18v298.3q0 46.93-33.12 80.06-33.13 33.12-80.06 33.12H197.83Zm195.06-229.46-78.78-78.78 369.28-369.28H576.13v-113.18h299.22v299.22H762.17v-107.26L392.89-314.11Z",
    600: "M203.04-80.09q-51.3 0-87.12-35.83-35.83-35.82-35.83-87.12v-553.92q0-51.3 35.83-87.12 35.82-35.83 87.12-35.83h289.18v122.95H203.04v553.92h553.92v-289.18h122.95v289.18q0 51.3-35.83 87.12-35.82 35.83-87.12 35.83H203.04Zm200.61-238.26-85.3-85.3 353.3-353.31h-99.43v-122.95h307.69v307.69H756.96v-99.43l-353.31 353.3Z",
    700: "M210-74q-57.12 0-96.56-39.44Q74-152.88 74-210v-540q0-57.13 39.44-96.56Q152.88-886 210-886h277v136H210v540h540v-277h136v277q0 57.12-39.44 96.56Q807.13-74 750-74H210Zm208-250-94-94 332-332h-89v-136h319v319H750v-89L418-324Z"
};

function getNearestWeight(w: number) {
    if (w >= 700) return 700;
    if (w >= 600) return 600;
    if (w >= 500) return 500;
    if (w >= 400) return 400;
    if (w >= 300) return 300;
    if (w >= 200) return 200;
    return 100;
}

interface ExternalLinkIconProps {
    width?: number | string;
    weight?: number;
    className?: string;
    style?: React.CSSProperties;
}

export const ExternalLinkIcon: React.FC<ExternalLinkIconProps> = ({ width = "1em", weight: providedWeight, className, style }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [weight, setWeight] = useState<number>(providedWeight ?? 400);

    useLayoutEffect(() => {
        if (providedWeight !== undefined) {
            setWeight(providedWeight);
            return;
        }

        if (svgRef.current) {
            const parent = svgRef.current.parentElement;
            if (parent) {
                const computedStyle = window.getComputedStyle(parent);
                const w = parseInt(computedStyle.fontWeight);
                if (!isNaN(w)) {
                    setWeight(getNearestWeight(w));
                }
            }
        }
    }, [providedWeight]);

    const pathData = PATHS[weight as keyof typeof PATHS] || PATHS[400];

    return (
        <svg
            ref={svgRef}
            width={width}
            height={width}
            viewBox="0 -960 960 960"
            fill="currentColor"
            className={className}
            aria-hidden="true"
            style={{
                display: "inline-block",
                verticalAlign: "middle",
                marginLeft: "0.2em",
                flexShrink: 0,
                marginTop: "-0.15em",
                ...style
            }}
        >
            <path d={pathData} />
        </svg>
    );
};
