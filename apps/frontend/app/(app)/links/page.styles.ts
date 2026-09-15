import styled, { createGlobalStyle, css } from "styled-components";
import { motion } from "framer-motion";
import Link from "next/link";

// Standalone page: hide the global navbar and footer
export const GlobalLinksStyle = createGlobalStyle`
    nav,
    footer {
        display: none !important;
    }
`;

export const PageContainer = styled.div`
    padding: 48px 16px 80px;
    max-width: 640px;
    margin: 0 auto;
`;

export const Column = styled(motion.div)`
    display: flex;
    flex-direction: column;
    gap: 28px;
`;

export const Profile = styled(motion.header)`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
`;

export const ShareWrapper = styled.div`
    position: absolute;
    top: 0;
    right: 0;
`;

export const Avatar = styled.div`
    width: 112px;
    height: 112px;
    padding: 4px;
    border-radius: 50%;
    background: var(--links-avatar-ring);
    margin-bottom: 16px;

    > div {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: var(--links-avatar-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    }
`;

export const Title = styled.h1`
    margin: 0;
    font-family: var(--font-title);
    font-size: 1.6rem;
    color: var(--links-title-text);
`;

export const Bio = styled.p`
    margin: 8px 0 0;
    max-width: 440px;
    line-height: 1.5;
    color: var(--links-bio-text);
`;

export const Section = styled(motion.section)`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

export const SectionTitle = styled.h2`
    margin: 0 0 4px;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-align: center;
    color: var(--links-section-title-text);
`;

const cardBase = css<{ $accent: string }>`
    --accent: ${({ $accent }) => $accent};
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    box-sizing: border-box;
    padding: 12px 16px 12px 12px;
    border-radius: 16px;
    background: var(--links-card-bg);
    border: 2px solid var(--links-card-border);
    box-shadow: var(--links-card-shadow);
    text-decoration: none;
    color: var(--links-card-title-text);
    transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease;

    &:hover,
    &:focus-visible {
        border-color: var(--accent);
        box-shadow: 0 10px 28px color-mix(in srgb, var(--accent) 20%, transparent);
        text-decoration: none;
    }

    &:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
    }
`;

export const ExternalCard = styled(motion.a)<{ $accent: string }>`
    ${cardBase}
`;

export const InternalCard = styled(motion.create(Link))<{ $accent: string }>`
    ${cardBase}
`;

export const IconBubble = styled.span`
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);

    svg {
        width: 24px;
        height: 24px;
    }
`;

export const CardText = styled.span`
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

export const CardTitle = styled.span`
    font-weight: 600;
    font-size: 1rem;
    line-height: 1.3;
    color: var(--links-card-title-text);
`;

export const CardDescription = styled.span`
    font-size: 0.85rem;
    line-height: 1.35;
    color: var(--links-card-description-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const CardArrow = styled.span`
    flex-shrink: 0;
    display: flex;
    color: var(--links-card-arrow-text);
    transition:
        color 0.2s ease,
        transform 0.2s ease;

    svg {
        width: 20px;
        height: 20px;
    }

    a:hover > &,
    a:focus-visible > & {
        color: var(--accent);
        transform: translateX(2px);
    }
`;

export const FeaturedImage = styled.span`
    position: relative;
    flex-shrink: 0;
    width: 72px;
    height: 72px;
    border-radius: 12px;
    overflow: hidden;
    background: var(--links-avatar-bg);

    img {
        object-fit: cover;
    }
`;

export const FeaturedBadge = styled.span`
    align-self: flex-start;
    padding: 2px 8px;
    margin-bottom: 2px;
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    background: var(--links-featured-badge-bg);
    color: var(--links-featured-badge-text);
`;
