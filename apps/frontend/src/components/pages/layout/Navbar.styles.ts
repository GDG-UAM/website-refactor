import Link from "next/link";
import type { Url } from "next/dist/shared/lib/router/router";
import styled, { css } from "styled-components";

export const Bar = styled.nav`
    position: sticky;
    top: 0;
    z-index: 1002;
    background: var(--navbar-bar-bg);
    color: var(--navbar-bar-text);
    border-bottom: 1px solid var(--navbar-bar-border-bottom);
    box-shadow: var(--navbar-bar-shadow);
`;

export const Inner = styled.div`
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;

    @media (min-width: 768px) {
        padding: 16px 28px;
    }
`;

export const Brand = styled(Link)`
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: inherit;
    font-weight: 600;
    letter-spacing: 0.2px;

    &:hover {
        color: inherit;
    }

    &:focus {
        color: inherit !important;
    }

    .brand-desktop {
        display: block;
        @media (max-width: 450px) {
            display: none;
        }
    }

    .brand-mobile {
        display: none;
        @media (max-width: 450px) {
            display: block;
        }
    }
`;

export const DesktopNav = styled.ul`
    list-style: none;
    display: none;
    margin: 0;
    padding: 0;
    gap: 6px;
    align-items: center;

    @media (min-width: 900px) {
        display: flex;
    }
`;

export const MobileNav = styled.ul<{ $open?: boolean; $aiActive: boolean }>`
    list-style: none;
    margin: 0;
    padding: 0;
    display: none;

    ${({ $open, $aiActive }) => css`
        @media (max-width: 899px) {
            position: fixed;
            top: ${$aiActive ? "110" : "68"}px;
            left: 0;
            right: 0;
            background: var(--navbar-mobile-bg);
            border-bottom: 1px solid var(--navbar-mobile-border-bottom);
            box-shadow: var(--navbar-mobile-shadow);
            display: flex;
            flex-direction: column;
            padding: 10px;
            transform: translateY(${$open ? "0" : "calc(-100% - 64px)"});

            visibility: ${$open ? "visible" : "hidden"};
            transition:
                transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                visibility 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1001;
        }
    `}
`;

// Overlay component for mobile menu
export const Overlay = styled.div<{ $open: boolean }>`
    @media (max-width: 899px) {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--navbar-overlay-bg);
        opacity: ${({ $open }) => ($open ? "1" : "0")};
        visibility: ${({ $open }) => ($open ? "visible" : "hidden")};
        transition:
            opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
            visibility 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 1000;
    }

    @media (min-width: 900px) {
        display: none;
    }
`;

export const NavItem = styled.li``;

const colorMap: Record<string, string> = {
    "/": "var(--navbar-link-text-active-root)",
    "/events": "var(--navbar-link-text-active-events)",
    "/newsletter": "var(--navbar-link-text-active-newsletter)",
    "/blog": "var(--navbar-link-text-active-blog)",
    "/about": "var(--navbar-link-text-active-about)",
    "/contact": "var(--navbar-link-text-active-contact)"
};

const bgMap: Record<string, string> = {
    "/": "var(--navbar-link-bg-active-root)",
    "/events": "var(--navbar-link-bg-active-events)",
    "/newsletter": "var(--navbar-link-bg-active-newsletter)",
    "/blog": "var(--navbar-link-bg-active-blog)",
    "/about": "var(--navbar-link-bg-active-about)",
    "/contact": "var(--navbar-link-bg-active-contact)"
};

// Slightly stronger background on hover
const hoverBgMap: Record<string, string> = {
    "/": "var(--navbar-link-bg-hover-active-root)",
    "/events": "var(--navbar-link-bg-hover-active-events)",
    "/newsletter": "var(--navbar-link-bg-hover-active-newsletter)",
    "/blog": "var(--navbar-link-bg-hover-active-blog)",
    "/about": "var(--navbar-link-bg-hover-active-about)",
    "/contact": "var(--navbar-link-bg-hover-active-contact)"
};

const navLinkStyles = css<{ $active?: boolean; href?: Url }>`
    display: inline-flex;
    align-items: center;
    padding: 10px 14px;
    border-radius: 8px;
    color: var(--navbar-link-text) !important;
    text-decoration: none;
    font-size: 1.02rem;
    line-height: 1;
    transition:
        background-color 0.15s ease-in-out,
        color 0.15s ease-in-out;

    /* use colored bg on hover */
    &:hover {
        background: ${({ href }) => bgMap[href as string] || "var(--navbar-link-bg-hover-default)"};
    }

    /* active state */
    ${({ $active, href }) =>
        $active &&
        css`
            color: ${colorMap[href as string] || colorMap["/"]} !important;
            background: ${bgMap[href as string] || bgMap["/"]};

            /* even stronger on hover when active */
            &:hover {
                background: ${hoverBgMap[href as string] || hoverBgMap["/"]};
            }
        `}
`;

export const NavLinkA = styled(Link)<{ $active?: boolean }>`
    ${navLinkStyles}
`;

export const Actions = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
`;

export const DesktopSpacer = styled.div`
    width: 8px;
    @media (max-width: 899px) {
        display: none;
    }
`;

export const CollapsableMenuWrapper = styled.div`
    @media (min-width: 900px) {
        display: none;
    }
`;
