import { getTrack } from "#/lib/hackathons-server";
import { AdminTeamLeaderboardDetailPage } from "#/components/pages/admin/hackathons/tracks/AdminTeamLeaderboardDetailPage";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ id: string; trackId: string; teamId: string }> }) {
    const { id, trackId, teamId } = await params;
    const track = await getTrack(id, trackId);

    if (!track) return notFound();

    return <AdminTeamLeaderboardDetailPage hackathonId={id} trackId={trackId} teamId={teamId} trackName={track.name} />;
}
