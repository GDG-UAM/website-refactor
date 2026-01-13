import { getHackathon, getTeam } from "#/lib/hackathons-server";
import { TeamCertificateTemplateFormPage } from "#/components/pages/admin/hackathons/teams/certificates/TeamCertificateTemplateFormPage";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ id: string; teamId: string }> }) {
    const { id, teamId } = await params;

    const [hackathon, team] = await Promise.all([getHackathon(id), getTeam(teamId)]);

    if (!hackathon || !team) return notFound();

    return <TeamCertificateTemplateFormPage hackathonId={id} teamId={teamId} hackathon={hackathon} team={team} />;
}
