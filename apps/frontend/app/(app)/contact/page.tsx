"use client";

import ContactForm from "#/components/pages/contact/ContactForm";
import FAQ from "#/components/pages/contact/FAQ";
import * as m from "#/paraglide/messages";
import { OpenSocialButton } from "#/components/Buttons";
import { useRef } from "react";
import { Grid, Left, PageContainer, RightWrapper, Title, Intro, FAQSection, FAQTitle } from "./page.styles";
import { motion } from "framer-motion";
import PageReveal from "#/components/PageReveal";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15
        }
    }
} as const;

const itemVariants = {
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

export default function Page() {
    const gridRef = useRef<HTMLDivElement>(null!);
    const rightRef = useRef<HTMLDivElement>(null!);

    return (
        <PageReveal>
            <PageContainer>
                <Grid ref={gridRef} as={motion.div} initial="hidden" animate="visible" variants={containerVariants}>
                    <Left as={motion.div} variants={itemVariants}>
                        <Title>
                            {m["contact.title"]()}
                            <div style={{ display: "flex", gap: "8px" }}>
                                <OpenSocialButton network="instagram" user="https://gdguam.es/l/instagram" ignoreStart iconSize={18} dontUseContext />
                                <OpenSocialButton network="whatsapp" user="https://gdguam.es/l/whatsapp" ignoreStart iconSize={18} dontUseContext />
                                <OpenSocialButton network="email" user="gdguam@gmail.com" iconSize={18} dontUseContext />
                                <OpenSocialButton network="gdgCommunity" user="https://gdguam.es/l/gdg-community" ignoreStart iconSize={18} dontUseContext />
                            </div>
                        </Title>
                        <Intro>{m["contact.intro"]()}</Intro>
                    </Left>

                    <RightWrapper ref={rightRef} as={motion.div} variants={itemVariants}>
                        <ContactForm gridRef={gridRef} rightRef={rightRef} />
                    </RightWrapper>

                    <FAQSection as={motion.div} variants={itemVariants}>
                        <FAQTitle>{m["contact.faq.title"]()}</FAQTitle>
                        <FAQ
                            items={Array.from({ length: 4 }).map((_, i) => ({
                                id: `faq_${i}`,
                                // @ts-ignore
                                question: m[`contact.faq.items._${i}.q`](),
                                // @ts-ignore
                                answer: m[`contact.faq.items._${i}.a`]()
                            }))}
                        />
                    </FAQSection>
                </Grid>
            </PageContainer>
        </PageReveal>
    );
}
