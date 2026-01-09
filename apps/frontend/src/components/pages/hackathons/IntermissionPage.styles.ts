import { motion } from "framer-motion";
import styled, { createGlobalStyle } from "styled-components";

export const GlobalIntermissionStyle = createGlobalStyle`
  nav, footer {
    display: none !important;
  }
  body, html {
    overflow: hidden !important;
    height: 100vh;
    margin: 0;
    padding: 0;
  }
`;

export const MobileMessage = styled.div`
    height: 100vh;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 40px;
    background: white;
    color: var(--foreground);
    box-sizing: border-box;

    h1 {
        font-size: 1.8rem;
        margin-bottom: 16px;
        letter-spacing: -1px;
        font-weight: 800;
    }

    p {
        opacity: 0.8;
        font-size: 1.1rem;
        max-width: 320px;
        line-height: 1.5;
        font-weight: 500;
    }
`;

export const Container = styled.div`
    height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 0 40px 0px 40px; /* Removed top padding */
    max-width: 100%;
    margin: 0;
    width: 100%;
    box-sizing: border-box;
    background: var(--color-white);
`;

export const TopBar = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 16px;
    flex-shrink: 0;
`;

export const OrganizerLogo = styled.img`
    height: 10vh;
    width: auto;
    object-fit: contain;
`;

export const MainContent = styled.div`
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    align-items: center;
    overflow: hidden;
    min-height: 0; /* Important for flex child to allow shrinking */
`;

export const ScheduleSection = styled.div`
    background: white;
    border-radius: 40px;
    padding: 32px 32px 0 32px;
    border: none;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
`;

export const ScheduleContainer = styled.div`
    position: relative;
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
`;

export const FadeOverlay = styled.div<{ $position: "top" | "bottom"; $visible: boolean }>`
    position: absolute;
    left: 0;
    right: 0;
    height: 80px;
    z-index: 2;
    pointer-events: none;
    opacity: ${(props) => (props.$visible ? 1 : 0)};
    transition: opacity 0.3s ease;
    background: linear-gradient(to ${(props) => (props.$position === "top" ? "bottom" : "top")}, white 0%, rgba(255, 255, 255, 0.9) 30%, transparent 100%);
    ${(props) => (props.$position === "top" ? "top: 0;" : "bottom: 0;")}
`;

export const CarouselSection = styled.div`
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
`;

export const CarouselItem = styled(motion.div)`
    position: absolute;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    cursor: default;
`;

export const ScheduleTitle = styled.h1`
    margin-bottom: 8px;
    color: var(--foreground);
    flex-shrink: 0;
    letter-spacing: -1px;
`;

export const ScheduleList = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: auto;
    flex: 1;
    padding: 12px 0 120px 0; /* Reduced top padding, keeping bottom for centering last items */

    &::-webkit-scrollbar {
        display: none;
    }
    scrollbar-width: none;
    -ms-overflow-style: none;

    scroll-behavior: smooth;
`;

export const ScheduleItem = styled.div<{ $active: boolean; $past: boolean }>`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 12px;
    border-radius: 10px;
    background: ${(props) => (props.$active ? "color-mix(in srgb, var(--google-blue) 8%, transparent)" : "transparent")};
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    transform: ${(props) => (props.$active ? "scale(1.01)" : "scale(1)")};
    opacity: ${(props) => (props.$past ? 0.4 : 1)};
    filter: ${(props) => (props.$past ? "grayscale(1)" : "none")};
`;

export const TimeTag = styled.div<{ $active: boolean; $past: boolean }>`
    font-weight: 800;
    font-size: 0.7rem;
    color: ${(props) => (props.$past ? "#70757a" : "var(--google-blue)")};
    background: ${(props) => (props.$past ? "#f1f3f4" : "color-mix(in srgb, var(--google-blue) 12%, transparent)")};
    padding: 4px 10px;
    border-radius: 6px;
    white-space: nowrap;
    letter-spacing: 0.01em;
    min-width: 70px;
    text-align: center;
`;

export const ActivityTitle = styled.div<{ $active: boolean; $past: boolean }>`
    font-size: 1.05rem;
    font-weight: ${(props) => (props.$active ? "800" : "600")};
    color: ${(props) => (props.$active ? "var(--foreground)" : props.$past ? "#70757a" : "#3c4043")};
    letter-spacing: -0.2px;
    line-height: 1.1;
    word-break: break-word;
`;

export const SponsorsSection = styled.div`
    padding-top: 32px;
    padding-bottom: 16px;
    display: flex;
    justify-content: center;
    width: 100%;
    height: auto;
    flex-shrink: 0;
`;

export const SponsorGrid = styled.div<{ $gap: number }>`
    display: flex;
    flex-wrap: nowrap;
    justify-content: center;
    align-items: flex-end;
    gap: ${(props) => props.$gap}px;
    width: 100%;
`;

export const SponsorLogo = styled.img<{ $height: number }>`
    height: ${(props) => props.$height}px;
    width: auto;
    object-fit: contain;
    transition: none;
`;
