import styled from "styled-components";
import Link from "next/link";
import { motion } from "framer-motion";

export const Nav = styled.nav`
    width: 100%;
    margin: 4px 0 12px 0;
`;

export const List = styled.ol`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    list-style: none;
    padding: 0;
    margin: 0;
    color: #4b5563;
    font-size: 14px;
`;

export const Crumb = styled(motion.li)`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;

    a {
        color: #2563eb;
        text-decoration: none;
    }
    a:hover {
        text-decoration: underline;
    }
`;

export const Sep = styled(motion.span)`
    color: #9ca3af;
`;

export const WarningContainer = styled.span`
    display: inline-flex;
    align-items: center;
    margin-right: 4px;

    svg {
        height: 18px;
        width: 18px;
    }
`;

export const CrumbAlign = styled(motion.span)`
    display: inline-flex;
    align-items: center;
`;

export const CrumbAlignLink = styled(motion(Link))`
    display: inline-flex;
    align-items: center;
`;
