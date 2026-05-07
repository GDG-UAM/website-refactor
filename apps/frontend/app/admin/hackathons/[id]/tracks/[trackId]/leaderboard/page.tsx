import { getTrack } from "#/lib/hackathons-server";
import { AdminTrackLeaderboardPage } from "#/components/pages/admin/hackathons/tracks/AdminTrackLeaderboardPage";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ id: string; trackId: string }> }) {
    const { id, trackId } = await params;
    const track = await getTrack(id, trackId);

    if (!track) return notFound();

    return <AdminTrackLeaderboardPage hackathonId={id} trackId={trackId} trackName={track.name} />;
}
