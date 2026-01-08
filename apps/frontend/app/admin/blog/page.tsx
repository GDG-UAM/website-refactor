import AdminNavigation from "#/components/pages/admin/AdminNavigation";
import * as m from "#/paraglide/messages";

export default function AdminBlogPage() {
    return <AdminNavigation title={m["admin.navigation.blog"]()} categories={[]} />;
}
