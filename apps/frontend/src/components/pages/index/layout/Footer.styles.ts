import styled from "styled-components";
import Link from "next/link";

export const FooterWrapper = styled.footer`
    background: var(--footer-bg);
    border-top: 1px solid var(--footer-wrapper-border-top);
    box-shadow: 0 -1px 2px var(--footer-wrapper-shadow);
    padding: 10px 20px 12px;
    color: var(--footer-text);
    margin-top: auto;
`;

export const Inner = styled.div`
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column-reverse;
    gap: 30px;

    @media (min-width: 768px) {
        flex-direction: row;
        justify-content: space-between;
        gap: 40px;
    }
`;

export const DisclaimerSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;

    @media (min-width: 768px) {
        flex: 2;
        max-width: 400px;
    }
`;

export const Section = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;

    @media (min-width: 768px) {
        flex: 1;
    }
`;

export const Title = styled.h4`
    font-size: 1rem;
    font-weight: 600;
    color: var(--footer-title-text);
    margin-bottom: 0;
`;

export const LinkList = styled.ul`
    list-style: none;
    padding: 0;
    margin: 0;
`;

export const FooterLink = styled(Link)`
    color: var(--footer-link-text);
    text-decoration: none;
    font-size: 0.95rem;

    &:hover {
        text-decoration: underline;
    }
`;

export const Disclaimer = styled.p`
    font-size: 0.85rem;
    color: var(--footer-disclaimer-text);
    line-height: 1.4;
    margin: 0;
`;

export const Copyright = styled.div`
    text-align: center;
    padding-top: 12px;
    margin: 12px 10% 0;
    border-top: 2px solid var(--footer-copyright-border-top);
    font-size: 0.85rem;
    color: var(--footer-copyright-text);
`;
