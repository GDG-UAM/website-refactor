import HomeHero from "#/components/pages/index/HomeHero";
import EventsTeaser from "#/components/pages/index/EventsTeaser";

export default async function HomePage() {
    return (
        <>
            <HomeHero
                joinHref="https://gdg.community.dev/gdg-on-campus-autonomous-university-of-madrid-madrid-spain"
                aboutHref="/about"
                nextSectionId="home-events"
            />
            <EventsTeaser events={[]} />
        </>
    );
}
