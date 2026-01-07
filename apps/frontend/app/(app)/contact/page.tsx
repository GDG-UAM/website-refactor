"use client";

import ContactForm from "#/components/pages/contact/ContactForm";
import FAQ from "#/components/pages/contact/FAQ";
import * as m from "#/paraglide/messages";
import { OpenSocialButton } from "#/components/Buttons";
import { useRef } from "react";
import { Grid, Left, PageContainer, RightWrapper, Title, Intro, FAQSection, FAQTitle } from "./page.styles";

export default function Page() {
    const gridRef = useRef<HTMLDivElement>(null!);
    const rightRef = useRef<HTMLDivElement>(null!);

    return (
        <PageContainer>
            <Grid ref={gridRef}>
                <Left>
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

                <RightWrapper ref={rightRef}>
                    <ContactForm gridRef={gridRef} rightRef={rightRef} />
                </RightWrapper>

                <FAQSection>
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
    );
}
