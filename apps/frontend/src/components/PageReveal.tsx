"use client";

import { motion } from "framer-motion";
import { PropsWithChildren } from "react";

const revealVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            duration: 0.6,
            ease: "easeOut"
        }
    }
} as const;

export default function PageReveal({ children }: PropsWithChildren) {
    return (
        <motion.div initial="hidden" animate="visible" variants={revealVariants}>
            {children}
        </motion.div>
    );
}
