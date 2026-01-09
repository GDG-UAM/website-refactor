import styled from "styled-components";

export const FABContainer = styled.div`
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 1000;

    @media (max-width: 768px) {
        display: none;
    }
`;
