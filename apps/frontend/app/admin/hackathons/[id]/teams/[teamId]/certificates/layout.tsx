import { RegisterBreadcrumbs } from "#/providers/BreadcrumbsProvider";
import * as m from "#/paraglide/messages";
import { getTeam } from "#/lib/hackathons-server";
import { notFound } from "next/navigation";

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string; teamId: string }> }) {
    const { id, teamId } = await params;

    const team = await getTeam(teamId);

    if (!team) {
        notFound();
    }

    return (
        <>
            <RegisterBreadcrumbs
                items={[
                    {
                        label: team.name,
                        href: `/admin/hackathons/${id}/teams/${teamId}`,
                        warning: team.isActive === false ? m["admin.hackathons.teams.deletedWarning"]() : undefined
                    },
                    { label: m["admin.hackathons.teams.certificates.breadcrumbs.certificates"](), href: `/admin/hackathons/${id}/teams/${teamId}/certificates` }
                ]}
            />
            {children}
        </>
    );
}
