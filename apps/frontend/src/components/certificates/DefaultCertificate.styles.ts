import styled from "styled-components";

export const CertificateWrapper = styled.div`
    padding: 20px;
    display: flex;
    justify-content: center;
    background-color: #f3f4f6; // Light gray background for the page/view
`;

export const CertificateCard = styled.div`
    position: relative;
    width: 1000px; /* Fixed print-like width for consistency */
    min-height: 700px;
    background-color: #ffffff;
    color: #1f2937;
    font-family: "Times New Roman", Times, serif; // Classical certificate feel
    box-shadow:
        0 10px 25px -5px rgba(0, 0, 0, 0.1),
        0 8px 10px -6px rgba(0, 0, 0, 0.1);
    padding: 60px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    border: 10px solid #ffffff;
    outline: 2px solid #e5e7eb;

    /* Decorative Border */
    &::before {
        content: "";
        position: absolute;
        top: 20px;
        left: 20px;
        right: 20px;
        bottom: 20px;
        border: 3px double #d1d5db;
        pointer-events: none;
        z-index: 0;
    }
`;

export const Watermark = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 500px;
    height: 500px;
    background-image: url("/logo/logo.svg");
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain;
    opacity: 0.03;
    z-index: 0;
    pointer-events: none;
`;

export const ContentLayer = styled.div`
    position: relative;
    z-index: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
`;

export const HeaderLogo = styled.img`
    height: 80px;
    margin-bottom: 30px;
    object-fit: contain;
`;

export const Title = styled.h1`
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 2.25rem; /* Slightly smaller than 3rem */
    font-weight: 700;
    color: #111827;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 4px;
    margin-bottom: 10px;
`;

export const Subtitle = styled.div`
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 1.25rem;
    color: #6b7280;
    margin-bottom: 10px; /* Reduced to move date higher */
    text-transform: uppercase;
    letter-spacing: 2px;
`;

export const DateDisplay = styled.div`
    margin-bottom: 30px;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 0.9rem;
    color: #9ca3af; /* Less noticeable color */
    font-weight: 500;
    /* Removed border-bottom */
    min-width: 200px;
`;

export const PresentationText = styled.div`
    font-size: 1.125rem;
    color: #4b5563;
    margin-bottom: 20px;
    font-style: italic;
`;

export const RecipientName = styled.div`
    font-family: "Georgia", "Times New Roman", serif; /* Normal serif font */
    font-size: 4rem;
    color: #000000;
    margin: 10px 0 20px 0;
    line-height: 1.2;
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 10px;
    min-width: 400px;
`;

export const Description = styled.p`
    font-size: 1.125rem;
    color: #4b5563;
    max-width: 700px;
    line-height: 1.8;
    margin-bottom: 40px;
    font-style: italic;
`;

// Metadata Grid
export const MetadataGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 20px;
    width: 100%;
    max-width: 800px;
    margin-bottom: 50px;
    padding: 20px;
    background-color: rgba(243, 244, 246, 0.5);
    border-radius: 8px;
    border: 1px solid #e5e7eb;
`;

export const MetadataItem = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;

    span.label {
        font-size: 0.75rem;
        text-transform: uppercase;
        color: #6b7280;
        font-weight: 600;
        letter-spacing: 0.5px;
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }

    span.value {
        font-size: 1rem;
        color: #1f2937;
        font-weight: 600;
    }
`;

export const Footer = styled.div`
    width: 100%;
    margin-top: auto;
    display: flex;
    justify-content: center; /* Centered signatures since date moved */
    align-items: flex-end;
    padding: 0 40px;
    margin-bottom: 20px;
`;

export const SignaturesSection = styled.div`
    display: flex;
    gap: 60px;
    align-items: flex-end;
`;

export const SignatureBlock = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    min-width: 180px;
    position: relative;
`;

export const SignatureImage = styled.img`
    height: 60px;
    width: auto;
    min-width: 150px; /* Enforce min width to maintain roughly 10:4 aspect or larger */
    object-fit: contain;
    margin-bottom: -10px; /* Moved line slightly down (was -15px) */
    z-index: 10;
    position: relative;
`;

export const SignatureLine = styled.div`
    width: 100%;
    height: 1px;
    background-color: #374151;
    margin: 0 0 8px 0; /* Line position */
    position: relative;
    z-index: 1;
`;

export const SignatureText = styled.div`
    font-size: 0.875rem;
    font-weight: 700;
    color: #111827;
`;

export const SignatureRole = styled.div`
    font-size: 0.875rem; /* Made bigger (was 0.75rem) */
    color: #6b7280;
    margin-top: 2px;
`;
