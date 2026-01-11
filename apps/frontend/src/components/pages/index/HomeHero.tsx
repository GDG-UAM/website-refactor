"use client";

import * as React from "react";
import * as m from "#/paraglide/messages";
import { ChevronDownButton, PlainButton } from "#/components/Buttons";
import {
    AfterTitle,
    ButtonStack,
    ColorUnderline,
    Container,
    Description,
    HeroRoot,
    Lockup,
    MainTitle,
    PillDots,
    ScrollHint,
    Subtitle,
    TitleWord,
    TitleWrap
} from "./HomeHero.styles";

type HomeHeroProps = {
    joinHref?: string;
    aboutHref?: string;
    nextSectionId?: string;
};

const AnimatedWord = ({ text, isGoogle = false }: { text: string; isGoogle?: boolean }) => (
    <TitleWord className={isGoogle ? "google" : ""}>
        {text.split("").map((ch, i) => (
            <span key={`${text}-${i}`} className={isGoogle ? "gletter" : `letter c${i % 4}`} data-i={i} style={{ "--i": i } as React.CSSProperties}>
                {ch}
            </span>
        ))}
    </TitleWord>
);

let hasAnimatedInThisSession = false;

export default function HomeHero({ joinHref = "https://gdguam.es/l/gdg-community", aboutHref = "/about", nextSectionId }: HomeHeroProps) {
    const [shouldAnimate] = React.useState(!hasAnimatedInThisSession);

    React.useEffect(() => {
        if (shouldAnimate) {
            hasAnimatedInThisSession = true;
        }
    }, [shouldAnimate]);

    const scrollDown = () => {
        if (!nextSectionId) return;
        const el = document.getElementById(nextSectionId);
        if (el) {
            const root = document.documentElement;
            const cssVar = getComputedStyle(root).getPropertyValue("--navbar-height") || "68";
            const navbarHeight = parseFloat(cssVar) || 68;
            const targetY = el.getBoundingClientRect().top + window.scrollY - navbarHeight;
            window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
        }
    };

    const openLink = (url: string, newTab: boolean = true) => {
        window.open(url, newTab ? "_blank" : "_self");
    };

    return (
        <HeroRoot $suppressAnimation={!shouldAnimate} role="region" aria-label="Hero principal">
            <Container>
                <Lockup>
                    <PillDots aria-hidden="true">
                        <span />
                        <span />
                        <span />
                        <span />
                    </PillDots>

                    <MainTitle>
                        <TitleWrap data-no-ai-translate>
                            <AnimatedWord text="Google" isGoogle /> <AnimatedWord text="Developer" /> <AnimatedWord text="Group" /> <AnimatedWord text="on" />{" "}
                            <AnimatedWord text="Campus" />
                        </TitleWrap>
                    </MainTitle>

                    <Subtitle>{m["index.hero.university"]()}</Subtitle>

                    <ColorUnderline aria-hidden="true" />

                    <AfterTitle>
                        <Description>{m["index.hero.description"]()}</Description>

                        <ButtonStack>
                            <PlainButton hasBorder slim onClick={() => openLink(joinHref, true)}>
                                {m["index.hero.joinChapter"]()}
                            </PlainButton>
                            <PlainButton noBackground slim color="secondary" onClick={() => openLink(aboutHref, false)}>
                                {m["index.hero.learnMore"]()}
                            </PlainButton>
                        </ButtonStack>
                    </AfterTitle>
                </Lockup>
            </Container>

            {nextSectionId && (
                <ScrollHint>
                    <ChevronDownButton noBackground hasBorder={false} slim noHover onClick={scrollDown}>
                        {m["index.hero.scroll"]()}
                    </ChevronDownButton>
                </ScrollHint>
            )}
        </HeroRoot>
    );
}
