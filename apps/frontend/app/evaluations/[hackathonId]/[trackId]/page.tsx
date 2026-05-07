import { EvaluationTeamsPage } from "#/components/pages/evaluations/EvaluationTeamsPage";
import { RegisterBreadcrumbs } from "#/providers/BreadcrumbsProvider";
import { getEvaluationHackathon, getEvaluationTrack } from "#/lib/evaluations-server";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ hackathonId: string; trackId: string }> }) {
    const { hackathonId, trackId } = await params;
    const [hackathon, track] = await Promise.all([
        getEvaluationHackathon(hackathonId),
        getEvaluationTrack(trackId)
    ]);

    if (!hackathon || "error" in hackathon || !track || "error" in track) {
        notFound();
    }

    return (
        <>
            <RegisterBreadcrumbs
                items={[
                    {
                        label: hackathon.title,
                        href: `/evaluations/${hackathonId}`,
                        noTranslate: true
                    },
                    {
                        label: track.name,
                        href: `/evaluations/${hackathonId}/${trackId}`,
                        noTranslate: true
                    }
                ]}
            />
            <EvaluationTeamsPage hackathonId={hackathonId} trackId={trackId} />
        </>
    );
}
