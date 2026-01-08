import AdminNavigation from "#/components/pages/admin/AdminNavigation";
import * as m from "#/paraglide/messages";
import { hasSectionAccess } from "#/lib/permissions/server";

export default async function AdminPage() {
    return (
        <AdminNavigation
            title={m["admin.title"]()}
            categories={[
                {
                    title: m["admin.navigation.categories.events"](),
                    buttons: [
                        { label: m["admin.navigation.events"](), type: "events", href: "/admin/events", disabled: !(await hasSectionAccess("admin.events")) },
                        {
                            label: m["admin.navigation.giveaways"](),
                            type: "giveaways",
                            href: "/admin/giveaways",
                            disabled: !(await hasSectionAccess("admin.giveaways"))
                        },
                        {
                            label: m["admin.navigation.hackathons"](),
                            type: "hackathons",
                            href: "/admin/hackathons",
                            disabled: !(await hasSectionAccess("admin.hackathons"))
                        }
                    ]
                },
                {
                    title: m["admin.navigation.categories.misc"](),
                    buttons: [
                        { label: m["admin.navigation.links"](), type: "links", href: "/admin/links", disabled: !(await hasSectionAccess("admin.links")) },
                        {
                            label: m["admin.navigation.certificates"](),
                            type: "certificates",
                            href: "/admin/certificates",
                            disabled: !(await hasSectionAccess("admin.certificates"))
                        },
                        {
                            label: m["admin.navigation.permissions"](),
                            type: "permissions",
                            href: "/admin/permissions",
                            disabled: !(await hasSectionAccess("admin.permissions"))
                        }
                    ]
                },
                {
                    title: m["admin.navigation.categories.articles"](),
                    buttons: [
                        { label: m["admin.navigation.blog"](), type: "blog", href: "/admin/blog", disabled: !(await hasSectionAccess("admin.blog")) },
                        {
                            label: m["admin.navigation.newsletter"](),
                            type: "newsletter",
                            href: "/admin/newsletter",
                            disabled: !(await hasSectionAccess("admin.newsletter"))
                        }
                    ]
                }
            ]}
        />
    );
}
