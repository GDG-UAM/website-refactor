import { getHackathon } from "#/lib/hackathons-server";
import { AdminTeamsPage } from "#/components/pages/admin/hackathons/teams/AdminTeamsPage";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const hackathon = await getHackathon(id);

    if (!hackathon) return notFound();

    return <AdminTeamsPage hackathonId={id} hackathon={hackathon} />;
}
