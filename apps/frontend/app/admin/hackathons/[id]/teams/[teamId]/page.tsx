import { getTeam } from "#/lib/hackathons-server";
import { AdminTeamsFormPage } from "#/components/pages/admin/hackathons/teams/AdminTeamsFormPage";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ id: string; teamId: string }> }) {
    const { id, teamId } = await params;

    const team = await getTeam(teamId);
    if (!team) return notFound();

    return <AdminTeamsFormPage hackathonId={id} id={teamId} initialData={team} />;
}
