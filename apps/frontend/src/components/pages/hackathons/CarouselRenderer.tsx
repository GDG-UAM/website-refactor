"use client";

import React from "react";
import { CustomQRCode } from "#/components/CustomQRCode";
import { CarouselElement } from "#/components/pages/admin/hackathons/intermission/IntermissionForm.types";
import { ElementContainer, TextElement, ImageElement, SpacerElement } from "./CarouselRenderer.styles";

export const CarouselRenderer: React.FC<{ element: CarouselElement }> = ({ element }) => {
    const { type, props, children } = element;

    switch (type) {
        case "container":
            return (
                <ElementContainer
                    $direction={props.direction ?? undefined}
                    $gap={props.gap ?? undefined}
                    $alignItems={props.alignItems ?? undefined}
                    $justifyContent={props.justifyContent ?? undefined}
                    $flex={props.flex ?? undefined}
                    $padding={props.padding ?? undefined}
                >
                    {children?.map((child) => (
                        <CarouselRenderer key={child.id} element={child} />
                    ))}
                </ElementContainer>
            );
        case "text":
            const tag = props.variant === "body" ? "p" : props.variant || "div";
            return (
                <TextElement
                    as={tag}
                    $variant={props.variant ?? undefined}
                    $color={props.color ?? undefined}
                    $align={props.align ?? undefined}
                    $fontSize={props.fontSize ?? undefined}
                    $fontWeight={props.fontWeight ?? undefined}
                >
                    {props.content}
                </TextElement>
            );
        case "qr":
            return (
                <CustomQRCode
                    value={props.value || ""}
                    size={props.size ?? 250}
                    cornerSize={props.cornerSize ?? 100}
                    cornerColor={props.cornerColor ?? undefined}
                    logoUrl={props.logoUrl ?? undefined}
                    logoSize={props.logoSize ?? undefined}
                />
            );
        case "image":
            return (
                <ImageElement
                    src={props.url || ""}
                    alt={props.alt || ""}
                    $height={props.height ?? undefined}
                    $width={props.width ?? undefined}
                    $objectFit={props.objectFit ?? undefined}
                />
            );
        case "spacer":
            return <SpacerElement $grow={props.grow ?? undefined} $height={props.heightPx ?? undefined} $width={props.widthPx ?? undefined} />;
        default:
            return null;
    }
};
