import styled from "styled-components";
import { motion } from "framer-motion";

export const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

export const Content = styled(motion.div)`
    width: 100%;
    max-width: 1200px;
`;

export const Title = styled(motion.h1)`
    margin: 0 0 8px 0;
    font-weight: 600;
`;

export const Grid = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;

    @media (min-width: 600px) {
        grid-template-columns: 1fr 1fr;
    }

    @media (min-width: 900px) {
        grid-template-columns: 1fr 1fr 1fr;
    }
`;

export const Category = styled(motion.section)`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

export const CategoryTitle = styled.h2`
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 4px;
`;

export const ButtonList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

export const ButtonRow = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
    width: 100%;

    & > :first-child {
        flex: 1;
    }
`;
