import { api } from "#/lib/eden";
import { notFound } from "next/navigation";
import IntermissionPage from "#/components/pages/hackathons/IntermissionPage";
import { buildSectionMetadata } from "#/lib/metadata";

export async function generateMetadata() {
    return buildSectionMetadata("intermission");
}

export default async function PublicIntermissionPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const { data: intermission } = await api.hackathons({ slug }).intermission.get();

    if (!intermission) {
        return notFound();
    }

    if (intermission.carousel) {
        intermission.carousel = intermission.carousel.map((slide) => ({
            ...slide,
            duration: slide.hidden ? 0 : slide.duration
        }));
    }

    return <IntermissionPage slug={slug} initialData={intermission} />;
}
