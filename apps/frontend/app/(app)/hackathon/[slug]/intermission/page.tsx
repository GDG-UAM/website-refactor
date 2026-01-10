import { api } from "#/lib/eden";
import { notFound } from "next/navigation";
import IntermissionPage from "#/components/pages/hackathons/IntermissionPage";
import { buildSectionMetadata } from "#/lib/metadata";
import { IntermissionData } from "#/components/pages/admin/hackathons/intermission/IntermissionForm.types";

export async function generateMetadata() {
    return buildSectionMetadata("intermission");
}

export default async function PublicIntermissionPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const { data: intermission } = await api.hackathons({ slug }).intermission.get();

    if (!intermission) {
        return notFound();
    }

    // Transform the data to match IntermissionData type
    const intermissionData: IntermissionData = {
        organizerLogoUrl: intermission.organizerLogoUrl ?? null,
        schedule: intermission.schedule ?? [],
        sponsors: intermission.sponsors ?? [],
        carousel: (intermission.carousel ?? []).map((slide) => ({
            ...slide,
            duration: slide.hidden ? 0 : slide.duration
        }))
    };

    return <IntermissionPage slug={slug} initialData={intermissionData} />;
}
