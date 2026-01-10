import { getHackathon } from "#/lib/hackathons-server";
import { AdminTrackFormPage } from "#/components/pages/admin/hackathons/tracks/AdminTrackFormPage";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const hackathon = await getHackathon(id);

    if (!hackathon) return notFound();

    return <AdminTrackFormPage hackathonId={id} hackathon={hackathon as any} />;
}
