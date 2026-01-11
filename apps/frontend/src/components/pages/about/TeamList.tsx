"use client";

import { motion } from "framer-motion";
import styled from "styled-components";
import ProfileCard from "#/components/pages/about/ProfileCard";

const TeamGrid = styled(motion.div)`
    display: flex;
    flex-wrap: wrap;
    gap: 24px;

    @media (max-width: 768px) {
        justify-content: center;
    }
`;

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
} as const;

export type TeamUser = {
    _id: string;
    name: string;
    image: string;
    showProfilePublicly: boolean;
};

type TeamPayload = { organizers: TeamUser[]; team: TeamUser[] };

export default function TeamList({ data, group }: { data?: TeamUser[]; group: keyof TeamPayload }) {
    if (data === undefined) {
        return (
            <TeamGrid variants={containerVariants} initial="hidden" animate="visible" viewport={{ once: true }}>
                {Array.from({ length: group === "organizers" ? 4 : 8 }).map((_, i) => (
                    <ProfileCard key={i} skeleton />
                ))}
            </TeamGrid>
        );
    }
    return (
        <TeamGrid variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
            {data.map((m) => (
                <ProfileCard key={m._id} id={m._id} name={m.name} image={m.image} showProfilePublicly={m.showProfilePublicly} />
            ))}
        </TeamGrid>
    );
}
