import { AdminTeamsFormPage } from "#/components/pages/admin/hackathons/teams/AdminTeamsFormPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return <AdminTeamsFormPage hackathonId={id} />;
}
