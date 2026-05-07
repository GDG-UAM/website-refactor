"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "#/lib/eden";
import { AdminTable } from "#/components/pages/admin/AdminTable";
import { textColumn, chipColumn, customColumn } from "#/components/pages/admin/AdminTableFactories";
import { EditButton, ImpersonateButton, ViewButton } from "#/components/Buttons";
import { newErrorToast, newInfoToast, newSuccessToast } from "#/components/Toast";
import { usePermissions } from "#/providers/PermissionsProvider";
import * as m from "#/paraglide/messages";
import { Container, Header, Title } from "#/components/pages/admin/AdminPage.styles";
import { authClient } from "#/lib/auth-client";
import { useSession } from "#/providers/SessionProvider";

export type AdminUser = NonNullable<Awaited<ReturnType<typeof api.admin.users.get>>["data"]>["items"][number];

export function AdminUsersPage() {
    const router = useRouter();
    const { ability } = usePermissions();
    const { data: sessionData } = useSession();
    const [rows, setRows] = useState<AdminUser[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const PAGE_SIZE = 50;

    const load = useCallback(
        async (notify?: boolean) => {
            try {
                setLoading(true);
                const { data, error } = await api.admin.users.get({
                    query: {
                        page,
                        pageSize: PAGE_SIZE,
                        search: search || undefined
                    }
                });

                if (!error && data) {
                    setRows(data.items.filter((u) => u.role !== "admin"));
                    setTotal(data.total);
                    if (notify) {
                        newInfoToast(m["admin.users.list.toasts.reloaded"]());
                    }
                } else {
                    throw new Error("Failed to load users");
                }
            } catch (e) {
                console.error("Failed to load users:", e);
                setRows([]);
                newErrorToast(m["admin.users.list.toasts.loadError"]());
            } finally {
                setLoading(false);
            }
        },
        [page, search]
    );

    useEffect(() => {
        load();
    }, [load]);

    const handleImpersonate = async (userId: string) => {
        try {
            const { error } = await authClient.admin.impersonateUser({
                userId
            });

            if (error) {
                console.error("[Admin] Impersonation failed:", error);
                newErrorToast(`${m["admin.users.list.toasts.impersonateError"]()}: ${error.statusText || error.status}`);
                return;
            }

            newSuccessToast(m["admin.users.list.toasts.impersonating"]());

            // Short delay to ensure session stickiness before reload
            setTimeout(() => {
                window.location.href = "/";
            }, 500);
        } catch (e) {
            console.error("Impersonation crash:", e);
            newErrorToast(m["admin.users.list.toasts.impersonateError"]());
        }
    };

    const columns = useMemo(
        () => [
            textColumn<AdminUser>("name", m["admin.users.list.columns.name"](), (r) => r.name, {
                bold: true,
                subValue: (r) => r.email,
                noTranslate: true
            }),
            chipColumn<AdminUser, string>(
                "role",
                m["admin.users.list.columns.role"](),
                (r) => r.role,
                (role) => role.charAt(0).toUpperCase() + role.slice(1),
                (role) => {
                    if (role === "admin") return "secondary";
                    if (role === "organizer") return "error";
                    if (role === "team") return "warning";
                    return "primary";
                },
                "filled"
            )
        ],
        []
    );

    return (
        <Container>
            <Header>
                <Title>{m["admin.users.page.title"]()}</Title>
            </Header>

            <AdminTable
                columns={columns}
                data={rows}
                loading={loading}
                onReload={() => load(true)}
                reloadLabel={m["admin.users.list.reload"]()}
                rowActions={(row) => (
                    <>
                        <ImpersonateButton
                            onClick={() => handleImpersonate(row._id)}
                            disabled={!["organizer", "admin"].includes(sessionData?.user.role || "") || ["organizer", "admin"].includes(row.role)}
                            iconSize={20}
                            ariaLabel="Impersonate user"
                            color="secondary"
                        />
                        {ability.canUpdateAnyField(`admin.users.${row._id}`, row) ? (
                            <EditButton onClick={() => router.push(`/admin/users/${row._id}`)} ariaLabel="Edit user" iconSize={20} />
                        ) : (
                            <ViewButton
                                onClick={() => router.push(`/admin/users/${row._id}`)}
                                ariaLabel="View user"
                                iconSize={20}
                                disabled={ability.cannot("read", `admin.users.${row._id}`)}
                            />
                        )}
                    </>
                )}
                search={{
                    value: search,
                    onChange: (val) => {
                        setSearch(val);
                        setPage(1);
                    },
                    placeholder: m["admin.users.list.search"]()
                }}
                emptyMessage={m["admin.users.list.noUsers"]()}
                noResultsMessage={m["admin.users.list.noResults"]()}
                pagination={{
                    page,
                    pageSize: PAGE_SIZE,
                    total,
                    onPageChange: setPage
                }}
            />
        </Container>
    );
}
