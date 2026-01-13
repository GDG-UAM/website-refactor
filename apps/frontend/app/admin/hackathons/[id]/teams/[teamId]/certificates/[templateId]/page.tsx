import { getHackathon, getTeam } from "#/lib/hackathons-server";
import { TeamCertificateTemplateFormPage } from "#/components/pages/admin/hackathons/teams/certificates/TeamCertificateTemplateFormPage";
import { notFound } from "next/navigation";
import { serverApi } from "#/lib/eden-server";

export default async function Page({ params }: { params: Promise<{ id: string; teamId: string; templateId: string }> }) {
    const { id, teamId, templateId } = await params;

    const [hackathon, team, templateRes] = await Promise.all([
        getHackathon(id),
        getTeam(teamId),
        serverApi.admin.certificates.templates({ id: templateId }).get()
    ]);

    if (!hackathon || !team) return notFound();

    const template = templateRes.data;
    if (!template || templateRes.error) return notFound();

    return (
        <TeamCertificateTemplateFormPage hackathonId={id} teamId={teamId} templateId={templateId} hackathon={hackathon} team={team} initialData={template} />
    );
}
