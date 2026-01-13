import styled from "styled-components";

export const CertificateWrapper = styled.div`
    width: 1000px;
    min-height: 707px;
    height: auto;
    background: #fdfdf5; /* Off-white / cream background */
    padding: 30px;
    box-sizing: border-box;
    position: relative;
    font-family: "Inter", "Outfit", sans-serif;
    color: #1a1a1a;
    overflow: hidden;
`;

export const BorderFrame = styled.div`
    position: absolute;
    top: 15px;
    left: 15px;
    right: 15px;
    bottom: 15px;
    border: 4px solid #0d7377;
    pointer-events: none;
    z-index: 10;
    overflow: hidden; /* This clips the decorations to the outer edge */

    &::before {
        content: "";
        position: absolute;
        top: 10px;
        left: 10px;
        right: 10px;
        bottom: 10px;
        border: 1px solid #0d7377;
        opacity: 0.5;
    }
`;

export const DecorationClip = styled.div`
    position: absolute;
    top: 19px; // 29px for inner border, 19px for outer
    left: 19px;
    right: 19px;
    bottom: 19px;
    overflow: hidden;
    pointer-events: none;
    z-index: 1;
`;

export const ContentLayer = styled.div`
    position: relative;
    z-index: 5;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 80px;
    box-sizing: border-box;
`;

export const HeaderLogos = styled.div`
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 25px;

    .divider {
        width: 1px;
        height: 50px;
        background: #0d7377;
        opacity: 0.3;
    }

    img {
        height: 50px;
        object-fit: contain;
    }
`;

export const MainTitle = styled.h1`
    margin: 0;
    font-size: 40px;
    text-transform: uppercase;
    color: #0d7377;
    letter-spacing: 3px;
    font-weight: 800;
    text-align: center;
`;

export const SubTitle = styled.h2`
    margin: 10px 0 5px;
    font-size: 26px;
    color: #000;
    font-weight: 700;
    text-transform: uppercase;
    text-align: center;
`;

export const DateDisplay = styled.div`
    font-size: 16px;
    color: #666;
    font-weight: 600;
    margin-bottom: 20px;
    text-transform: uppercase;
    letter-spacing: 1px;
`;

export const AwardText = styled.p`
    margin: 0;
    font-size: 18px;
    color: #666;
    font-style: italic;
`;

export const RecipientName = styled.h3`
    margin: 5px 0 25px;
    font-size: 52px;
    font-weight: 800;
    color: #0d7377;
    text-transform: uppercase;
    text-align: center;
`;

export const Description = styled.p`
    margin: -10px 0 30px;
    font-size: 16px;
    color: #444;
    text-align: center;
    max-width: 700px;
    line-height: 1.5;
`;

export const MetadataGrid = styled.div`
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 15px;
    margin-bottom: 40px;
`;

export const MetadataItem = styled.div`
    background: #7b1fa2; /* Fixed Purple Role Color */
    color: white;
    padding: 6px 20px;
    border-radius: 50px;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 10px rgba(123, 31, 162, 0.2);

    .label {
        opacity: 0.8;
        font-size: 12px;
    }
`;

export const Footer = styled.div`
    width: 100%;
    margin-top: auto;
    display: flex;
    justify-content: space-around;
    gap: 60px;
`;

export const SignatureBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 280px;
`;

export const SignatureImg = styled.img`
    height: 60px;
    margin-bottom: -10px;
    z-index: 1;
`;

export const SignatureLine = styled.div`
    width: 100%;
    border-top: 1.5px solid #1a1a1a;
    margin-bottom: 8px;
`;

export const SignatureName = styled.div`
    font-weight: 700;
    font-size: 14px;
    color: #1a1a1a;
`;

export const SignatureRole = styled.div`
    font-size: 12px;
    color: #666;
    text-align: center;
`;

export const DecorationContainer = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;

    .shapes {
        position: absolute;
        width: 300px;
        height: 300px;
    }

    .top-left {
        top: -40px;
        left: -40px;
        transform: rotate(-10deg);
    }

    .bottom-right {
        bottom: -20px;
        right: -20px;
        transform: rotate(170deg);
    }

    .dots {
        position: absolute;
        display: grid;
        grid-template-columns: repeat(6, 10px);
        gap: 10px;
        opacity: 0.4;
        .dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #f0a500;
        }
    }

    .dots-tl {
        top: 60px;
        left: 40px;
    }

    .dots-br {
        bottom: 60px;
        right: 40px;
    }
`;
