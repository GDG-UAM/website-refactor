import styled from "styled-components";

export const ElementContainer = styled.div<{
    $direction?: string;
    $gap?: number;
    $alignItems?: string;
    $justifyContent?: string;
    $flex?: number;
    $padding?: string;
}>`
    display: flex;
    flex-direction: ${(props) => props.$direction || "column"};
    gap: ${(props) => props.$gap || 0}px;
    align-items: ${(props) => props.$alignItems || "center"};
    justify-content: ${(props) => props.$justifyContent || "center"};
    flex: ${(props) => (props.$flex !== undefined ? props.$flex : "none")};
    padding: ${(props) => props.$padding || "0"};
    width: ${(props) => (props.$flex !== undefined ? "auto" : "100%")};
`;

export const TextElement = styled.div<{
    $variant?: string;
    $color?: string;
    $align?: string;
    $fontSize?: string;
    $fontWeight?: string;
}>`
    ${(props) => props.$color && `color: ${props.$color};`}
    ${(props) => props.$align && `text-align: ${props.$align};`}
  ${(props) => props.$fontWeight && `font-weight: ${props.$fontWeight};`}
  ${(props) => props.$fontSize && `font-size: ${props.$fontSize};`}
  
  margin: 0;
    white-space: pre-wrap;
`;

export const ImageElement = styled.img<{
    $height?: string;
    $width?: string;
    $objectFit?: string;
}>`
    height: ${(props) => props.$height || "auto"};
    width: ${(props) => props.$width || "auto"};
    object-fit: ${(props) => props.$objectFit || "contain"};
    max-width: 100%;
    display: block;
    border-radius: 20px;
`;

export const SpacerElement = styled.div<{
    $grow?: number;
    $height?: number;
    $width?: number;
}>`
    flex-grow: ${(props) => props.$grow || 0};
    height: ${(props) => (props.$height ? `${props.$height}px` : "auto")};
    width: ${(props) => (props.$width ? `${props.$width}px` : "auto")};
`;
