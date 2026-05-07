import { EvaluationFormPage } from "#/components/pages/evaluations/EvaluationFormPage";
import { RegisterBreadcrumbs } from "#/providers/BreadcrumbsProvider";
import { getEvaluationHackathon, getEvaluationTrack, getEvaluationTeam } from "#/lib/evaluations-server";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ hackathonId: string; trackId: string; teamId: string }> }) {
    const { hackathonId, trackId, teamId } = await params;
    const [hackathon, track, team] = await Promise.all([
        getEvaluationHackathon(hackathonId),
        getEvaluationTrack(trackId),
        getEvaluationTeam(teamId)
    ]);

    if (!hackathon || "error" in hackathon || !track || "error" in track || !team || "error" in team) {
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
                    },
                    {
                        label: team.name,
                        href: `/evaluations/${hackathonId}/${trackId}/${teamId}`,
                        noTranslate: true
                    }
                ]}
            />
            <EvaluationFormPage hackathonId={hackathonId} trackId={trackId} teamId={teamId} />
        </>
    );
}
