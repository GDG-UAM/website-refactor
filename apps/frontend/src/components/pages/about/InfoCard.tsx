"use client";

import { motion } from "framer-motion";
import { PropsWithChildren } from "react";
import styled from "styled-components";

type StyledProps = { $color: string };

const CardContainer = styled(motion.div)<StyledProps>`
    background: var(--color-white);
    border-radius: 16px;
    padding: 0 32px 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border: 2px solid transparent;
    display: flex;
    flex-direction: column;
`;

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 260,
            damping: 20
        }
    }
} as const;

export type InfoCardProps = PropsWithChildren<{
    color: string;
    className?: string;
}>;

export default function InfoCard({ color, className, children }: InfoCardProps) {
    return (
        <CardContainer
            $color={color}
            className={className}
            variants={itemVariants}
            whileHover={{
                y: -8,
                border: `2px solid ${color}`,
                boxShadow: `0 12px 32px color-mix(in srgb, ${color} 20%, transparent)`
            }}
            whileTap={{ scale: 0.98 }}
        >
            {children}
        </CardContainer>
    );
}
