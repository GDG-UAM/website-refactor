import styled from "styled-components";

export const QRWrapper = styled.div`
    position: relative;
    width: min-content;
    padding: 20px;
`;

export const InnerQR = styled.div`
    position: relative;
    padding: 10px;
    border-radius: 18px;
    background: #fff;
    box-shadow: 0 0 0 5px #000;
    display: inline-block;
    line-height: 0;
`;

const CornerBase = styled.div<{ $qrCornerSize: number; $color?: string }>`
    position: absolute;
    width: ${({ $qrCornerSize }) => $qrCornerSize}px;
    height: ${({ $qrCornerSize }) => $qrCornerSize}px;
    border-radius: 20px;
    border: 5px solid #000;
    z-index: 0;
    background: ${({ $color }) => $color || "transparent"};
`;

export const CornerTL = styled(CornerBase)`
    top: 0;
    left: 0;
    ${({ $color }) => !$color && "background: var(--google-red);"}
    border-top-left-radius: 10px;
`;

export const CornerTR = styled(CornerBase)`
    top: 0;
    right: 0;
    ${({ $color }) => !$color && "background: var(--google-green);"}
    border-top-right-radius: 10px;
`;

export const CornerBL = styled(CornerBase)`
    bottom: 0;
    left: 0;
    ${({ $color }) => !$color && "background: var(--google-blue);"}
    border-bottom-left-radius: 10px;
`;

export const CornerBR = styled(CornerBase)`
    bottom: 0;
    right: 0;
    ${({ $color }) => !$color && "background: var(--google-yellow);"}
    border-bottom-right-radius: 10px;
`;

export const LogoContainer = styled.div<{ $size: number }>`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
    background: white;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
`;
