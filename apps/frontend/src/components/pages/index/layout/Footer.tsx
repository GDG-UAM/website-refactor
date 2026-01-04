"use client";

import Link from "next/link";
import * as m from "#/paraglide/messages";
import { Socials } from "#/components/Socials";
import { RichText } from "#/components/RichText";
import { Copyright, Disclaimer, DisclaimerSection, FooterLink, Inner, LinkList, Section, Title, FooterWrapper } from "./Footer.styles";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <FooterWrapper>
            <Inner>
                <DisclaimerSection>
                    <Title>{m["footer.disclaimer.title"]()}</Title>
                    <Disclaimer>
                        <RichText
                            text={m["footer.disclaimer.text"]()}
                            components={{
                                link: (
                                    <a
                                        href="https://developers.google.com/community/gdg"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        data-no-ai-translate
                                        className="intext"
                                        style={{ lineBreak: "anywhere" }}
                                    >
                                        https://developers.google.com/community/gdg
                                    </a>
                                )
                            }}
                        />
                    </Disclaimer>
                </DisclaimerSection>

                <Section>
                    <Title>{m["footer.quickLinks"]()}</Title>
                    <LinkList>
                        <li>
                            <FooterLink href="/about">{m["footer.about"]()}</FooterLink>
                        </li>
                        <li>
                            <FooterLink href="/blog">{m["footer.blog"]()}</FooterLink>
                        </li>
                        <li>
                            <FooterLink href="/events">{m["footer.events"]()}</FooterLink>
                        </li>
                        <li>
                            <FooterLink href="/contact">{m["footer.contact"]()}</FooterLink>
                        </li>
                        <li>
                            <FooterLink href="/blog/privacy">{m["footer.privacy"]()}</FooterLink>
                        </li>
                    </LinkList>
                </Section>

                <Section>
                    <Title>{m["footer.connectWithUs"]()}</Title>
                    <Socials></Socials>
                </Section>
            </Inner>

            <Copyright>
                <div style={{ marginTop: 0, marginBottom: 0 }}>
                    <RichText
                        text={m["footer.credits"]()}
                        components={{
                            hector: (
                                <Link className="intext" data-no-ai-translate href="https://gdguam.es/l/hector-tablero">
                                    Héctor Tablero Díaz
                                </Link>
                            ),
                            jose: (
                                <Link className="intext" data-no-ai-translate href="https://gdguam.es/l/jose-arbelaez">
                                    José Arbelaez Nieto
                                </Link>
                            )
                        }}
                    />
                </div>
                {m["footer.copyright"]({
                    year: `© ${currentYear} GDGoC UAM`
                })}
            </Copyright>
        </FooterWrapper>
    );
}
