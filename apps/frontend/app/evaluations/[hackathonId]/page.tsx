import { EvaluationTracksPage } from "#/components/pages/evaluations/EvaluationTracksPage";
import { RegisterBreadcrumbs } from "#/providers/BreadcrumbsProvider";
import { getEvaluationHackathon } from "#/lib/evaluations-server";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ hackathonId: string }> }) {
    const { hackathonId } = await params;
    const hackathon = await getEvaluationHackathon(hackathonId);

    if (!hackathon || "error" in hackathon) {
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
                    }
                ]}
            />
            <EvaluationTracksPage hackathonId={hackathonId} />
        </>
    );
}
