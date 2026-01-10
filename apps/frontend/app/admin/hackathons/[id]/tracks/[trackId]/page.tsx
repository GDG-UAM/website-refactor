import { getHackathon, getTrack } from "#/lib/hackathons-server";
import { AdminTrackFormPage } from "#/components/pages/admin/hackathons/tracks/AdminTrackFormPage";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ id: string; trackId: string }> }) {
    const { id, trackId } = await params;

    // Fetch both hackathon and track data in parallel
    const [hackathon, track] = await Promise.all([getHackathon(id), getTrack(id, trackId)]);

    if (!hackathon || !track) return notFound();

    return <AdminTrackFormPage hackathonId={id} trackId={trackId} initialData={track} hackathon={hackathon as any} />;
}
