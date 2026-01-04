import HomeHero from "#/components/pages/index/HomeHero";

export default async function HomePage() {
    return (
        <HomeHero
            joinHref="https://gdg.community.dev/gdg-on-campus-autonomous-university-of-madrid-madrid-spain"
            aboutHref="/about"
            nextSectionId="home-events"
        />
    );
}
