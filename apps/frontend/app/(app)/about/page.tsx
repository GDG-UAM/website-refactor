"use client";

import styled from "styled-components";
import * as m from "#/paraglide/messages";
import { Socials } from "#/components/Socials";
import InfoCard from "#/components/pages/about/InfoCard";
import { api } from "#/lib/eden";
import TeamList from "#/components/pages/about/TeamList";
import { RichText } from "#/components/RichText";
import { useState, useEffect } from "react";

const PageContainer = styled.div`
    min-height: 100vh;
    padding: 40px 32px 80px;
`;

const ContentWrapper = styled.div`
    max-width: 1280px;
    margin: 0 auto;
`;

const Section = styled.section`
    margin-bottom: 72px;
`;

const MainTitle = styled.h1`
    font-size: 2rem;
    margin-bottom: 12px;
    margin-top: 0;
`;

const MainSubtitle = styled.h2`
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 24px;
    color: var(--google-light-gray);
`;

const StyledParagraph = styled.p`
    font-size: 1.1rem;
    line-height: 1.7;
    color: var(--google-dark-gray);
    max-width: 900px;
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 24px;
`;

const SectionTitle = styled.h3`
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 24px;
    color: var(--google-dark-gray);
`;

const CardTitle = styled.h4`
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--google-dark-gray);
    margin-bottom: 8px;
`;

const CardText = styled.p`
    font-size: 1rem;
    color: var(--google-light-gray);
    line-height: 1.6;
`;

const Divider = styled.hr`
    margin: 64px 0;
    border: none;
    border-top: 1px solid var(--color-gray-300);
`;

const Disclaimer = styled.div`
    margin-top: 40px;
    padding: 24px;
    background-color: var(--google-super-light-gray);
    border-left: 4px solid var(--google-blue);
    border-radius: 8px;
    color: var(--google-light-gray);
    font-size: 0.9rem;
    max-width: 900px;
`;

const SocialsContainer = styled.div`
    margin-top: 24px;
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
`;

const TeamContainer = styled.div`
    margin-top: 32px;
`;

const TeamSubtitle = styled.h4`
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 16px;
    color: var(--google-dark-gray);
`;

function GoogleNode() {
    const colors = ["var(--google-blue)", "var(--google-red)", "var(--google-yellow)", "var(--google-blue)", "var(--google-green)", "var(--google-red)"];
    const text = m["about.subtitle_google"]();
    return (
        <span
            onMouseEnter={(e) => {
                const target = e.currentTarget as HTMLElement;
                Array.from(target.children).forEach((child, i) => {
                    (child as HTMLElement).style.color = colors[i % colors.length];
                });
            }}
            onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLElement;
                Array.from(target.children).forEach((child) => {
                    (child as HTMLElement).style.color = "inherit";
                });
            }}
        >
            {text.split("").map((char, i) => (
                <span key={i} style={{ transition: "color 0.5s" }}>
                    {char}
                </span>
            ))}
        </span>
    );
}

export default function AboutPage() {
    // Inline, module-scope constants to avoid re-creating per render
    const missionColors = ["var(--google-blue)", "var(--google-red)", "var(--google-yellow)", "var(--google-green)"] as const;
    const whatWeDoColors = ["var(--google-green)", "var(--google-blue)", "var(--google-yellow)", "var(--google-red)"] as const;
    const [data, setData] = useState<Awaited<ReturnType<typeof api.users.team.get>>["data"] | undefined>(undefined);

    useEffect(() => {
        (async () => {
            setData((await api.users.team.get()).data);
        })();
    }, []);

    return (
        <PageContainer>
            <ContentWrapper>
                <MainTitle>{m["about.title"]()}</MainTitle>
                <MainSubtitle data-no-ai-translate>
                    <RichText
                        text={m["about.subtitle"]()}
                        components={{
                            google: <GoogleNode />,
                            uni: <span style={{ color: "var(--google-green)", fontWeight: 600 }}>{m["about.subtitle_uni"]()}</span>
                        }}
                    />
                </MainSubtitle>
                <StyledParagraph>{m["about.intro"]()}</StyledParagraph>

                <Divider />

                <Section>
                    <SectionTitle style={{ color: "var(--google-blue)" }}>{m["about.missionTitle"]()}</SectionTitle>
                    <Grid>
                        {Array.from({ length: 4 }, (_, index) => (
                            <InfoCard key={index} color={missionColors[index]}>
                                {/* @ts-ignore */}
                                <CardTitle>{m[`about.mission.${index}.title`]()}</CardTitle>
                                {/* @ts-ignore */}
                                <CardText>{m[`about.mission.${index}.text`]()}</CardText>
                            </InfoCard>
                        ))}
                    </Grid>
                </Section>

                <Divider />

                <Section>
                    <SectionTitle style={{ color: "var(--google-red)" }}>{m["about.whatWeDoTitle"]()}</SectionTitle>
                    <Grid>
                        {Array.from({ length: 4 }, (_, index) => (
                            <InfoCard key={index} color={whatWeDoColors[index]}>
                                {/* @ts-ignore */}
                                <CardTitle>{m[`about.whatWeDo.${index}.title`]()}</CardTitle>
                                {/* @ts-ignore */}
                                <CardText>{m[`about.whatWeDo.${index}.description`]()}</CardText>
                            </InfoCard>
                        ))}
                    </Grid>
                </Section>

                <Divider />

                <Section>
                    <SectionTitle style={{ color: "var(--google-yellow)" }}>{m["about.visionTitle"]()}</SectionTitle>
                    <StyledParagraph>{m["about.vision"]()}</StyledParagraph>
                </Section>

                <Divider />

                <Section>
                    <SectionTitle style={{ color: "var(--google-green)" }}>{m["about.historyTitle"]()}</SectionTitle>
                    <StyledParagraph>{m["about.history"]()}</StyledParagraph>
                    <Disclaimer
                        style={{
                            marginTop: 16,
                            marginBottom: 0,
                            fontSize: "1rem",
                            fontWeight: 500,
                            background: "var(--color-gray-100)",
                            borderLeft: "6px solid var(--google-blue)",
                            color: "var(--google-dark-gray)"
                        }}
                    >
                        <span style={{ fontWeight: 700, color: "var(--google-blue)" }} data-no-ai-translate>
                            Google Developer Group On Campus - Universidad Autónoma de Madrid
                        </span>
                        <span>{m["about.disclaimer"]()}</span>
                    </Disclaimer>
                </Section>

                <Divider />

                <Section>
                    <SectionTitle style={{ color: "var(--google-red)" }}>{m["about.connectTitle"]()}</SectionTitle>
                    <StyledParagraph>{m["about.connect"]()}</StyledParagraph>
                    <SocialsContainer>
                        <Socials />
                    </SocialsContainer>
                </Section>

                <Divider />

                <Section>
                    {/* Inline TeamSection with skeletons */}
                    <SectionTitle style={{ color: "var(--google-yellow)" }}>{m["about.teamTitle"]()}</SectionTitle>
                    <TeamContainer>
                        <TeamSubtitle>{m["about.organizersTitle"]()}</TeamSubtitle>
                        <TeamList data={data?.filter((user) => user.role === "organizer")} group="organizers" />
                    </TeamContainer>

                    <TeamContainer style={{ marginTop: 48 }}>
                        <TeamSubtitle>{m["about.membersTitle"]()}</TeamSubtitle>
                        <TeamList data={data?.filter((user) => user.role === "team")} group="team" />
                    </TeamContainer>
                </Section>
            </ContentWrapper>
        </PageContainer>
    );
}
