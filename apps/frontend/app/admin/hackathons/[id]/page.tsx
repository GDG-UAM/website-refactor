import AdminNavigation from "#/components/pages/admin/AdminNavigation";
import * as m from "#/paraglide/messages";
import { hasSectionAccess } from "#/lib/permissions/server";
import { getHackathon } from "#/lib/hackathons-server";
import { notFound } from "next/navigation";

export default async function AdminPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const hackathon = await getHackathon(id);

    if (!hackathon) {
        notFound();
    }

    return (
        <AdminNavigation
            title={m["admin.hackathons.page.title"]()}
            categories={[
                {
                    title: m["admin.hackathons.navigation.categories.teams"](),
                    buttons: [
                        {
                            label: m["admin.hackathons.navigation.teams"](),
                            type: "hackathon-teams",
                            href: `/admin/hackathons/${hackathon._id}/teams`,
                            disabled: !(await hasSectionAccess(`admin.hackathons.${hackathon._id}.teams`))
                        }
                    ]
                },
                {
                    title: m["admin.hackathons.navigation.categories.intermission"](),
                    buttons: [
                        {
                            label: m["admin.hackathons.navigation.intermission"](),
                            type: "hackathon-intermission",
                            href: `/admin/hackathons/${hackathon._id}/intermission`,
                            disabled: !(await hasSectionAccess(`admin.hackathons.${hackathon._id}.intermission`)),
                            openLinkHref: `/hackathon/${hackathon.slug}/intermission`
                        }
                    ]
                },
                {
                    title: m["admin.hackathons.navigation.categories.certificates"](),
                    buttons: [
                        {
                            label: m["admin.hackathons.navigation.certificates"](),
                            type: "hackathon-certificates",
                            href: `/admin/hackathons/${hackathon._id}/certificates`,
                            disabled: !(await hasSectionAccess(`admin.hackathons.${hackathon._id}.certificates`))
                        }
                    ]
                },
                {
                    title: m["admin.hackathons.navigation.categories.tracks"](),
                    buttons: [
                        {
                            label: m["admin.hackathons.navigation.tracks"](),
                            type: "hackathon-tracks",
                            href: `/admin/hackathons/${hackathon._id}/tracks`,
                            disabled: !(await hasSectionAccess(`admin.hackathons.${hackathon._id}.tracks`))
                        },
                        {
                            label: m["admin.hackathons.navigation.selection"](),
                            type: "hackathon-track-selection",
                            href: `/admin/hackathons/${hackathon._id}/selection`,
                            disabled: !(await hasSectionAccess(`admin.hackathons.${hackathon._id}.trackSelection`))
                        }
                    ]
                }
            ]}
        />
    );
}
