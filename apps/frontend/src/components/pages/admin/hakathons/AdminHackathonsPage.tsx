"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "#/lib/eden";
import { AdminTable } from "#/components/pages/admin/AdminTable";
import { textColumn, chipColumn, customColumn } from "#/components/pages/admin/AdminTableFactories";
import { AddButton, EditButton, DeleteButton, RestoreButton, ViewButton, ManageButton } from "#/components/Buttons";
import { newErrorToast, newInfoToast, newSuccessToast } from "#/components/Toast";
import { usePermissions } from "#/providers/PermissionsProvider";
import { FormControlLabel, Checkbox } from "@mui/material";
import * as m from "#/paraglide/messages";
import { Container, Header, Title } from "#/components/pages/admin/AdminPage.styles";
import { HackathonDate, HackathonLocation } from "./AdminHackathonsPage.styles";

export type AdminHackathon = NonNullable<Awaited<ReturnType<typeof api.admin.hackathons.get>>["data"]>["items"][number];

export function AdminHackathonsPage() {
    const router = useRouter();
    const { ability } = usePermissions();
    const [rows, setRows] = useState<AdminHackathon[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [includeInactive, setIncludeInactive] = useState(false);

    // Types derived from API
    type HackathonQuery = NonNullable<NonNullable<Parameters<typeof api.admin.hackathons.get>[0]>["query"]>;
    type HackathonSort = NonNullable<HackathonQuery["sort"]>;

    // Filters
    const [sortFilter, setSortFilter] = useState<HackathonSort>("newest");

    const PAGE_SIZE = 50;

    const canCreate = ability.can("create", "admin.hackathons");
    const canManage = ability.can("manage", "admin.hackathons");

    const load = useCallback(
        async (notify?: boolean) => {
            try {
                setLoading(true);
                const { data, error } = await api.admin.hackathons.get({
                    query: {
                        page,
                        pageSize: PAGE_SIZE,
                        sort: sortFilter,
                        search: search || undefined,
                        includeInactive
                    }
                });

                if (!error && data) {
                    setRows(data.items);
                    setTotal(data.total);
                    if (notify) {
                        newInfoToast(m["admin.hackathons.list.toasts.reloaded"]());
                    }
                } else {
                    throw new Error("Failed to load hackathons");
                }
            } catch (e) {
                console.error("Failed to load hackathons:", e);
                setRows([]);
                newErrorToast(m["admin.hackathons.list.toasts.loadError"]());
            } finally {
                setLoading(false);
            }
        },
        [sortFilter, page, search, includeInactive]
    );

    useEffect(() => {
        load();
    }, [load]);

    const handleDelete = async (id: string) => {
        try {
            const { error } = await api.admin.hackathons({ id }).delete();

            if (!error) {
                newSuccessToast(m["admin.hackathons.list.toasts.deleteSuccess"]());
                load();
            } else {
                throw new Error("Failed to delete hackathon");
            }
        } catch (e) {
            console.error("Delete error:", e);
            newErrorToast(e instanceof Error ? e.message : m["admin.hackathons.list.toasts.deleteError"]());
        }
    };

    const handleRestore = async (id: string) => {
        try {
            const { error } = await api.admin.hackathons({ id }).patch({ isActive: true });

            if (!error) {
                newSuccessToast(m["admin.hackathons.list.toasts.restoreSuccess"]());
                load();
            } else {
                throw new Error("Failed to restore hackathon");
            }
        } catch (e) {
            console.error("Restore error:", e);
            newErrorToast(e instanceof Error ? e.message : m["admin.hackathons.list.toasts.restoreError"]());
        }
    };

    const columns = useMemo(
        () => [
            textColumn<AdminHackathon>("title", m["admin.hackathons.form.title"](), (r) => r.title, {
                bold: true,
                subValue: (r) => r.slug
            }),
            customColumn<AdminHackathon>("date", m["admin.hackathons.form.date"](), (r) => (
                <HackathonDate>{new Date(r.date).toLocaleDateString()}</HackathonDate>
            )),
            customColumn<AdminHackathon>("location", m["admin.hackathons.form.location"](), (r) => <HackathonLocation>{r.location}</HackathonLocation>),
            chipColumn<AdminHackathon, "active" | "deleted">(
                "status",
                m["admin.hackathons.list.columns.status"](),
                (r) => (r.isActive ? "active" : "deleted"),
                (status) => (status === "active" ? m["admin.links.list.status_active"]() : m["admin.events.list.status_deleted"]()),
                (status) => (status === "active" ? "success" : "error"),
                "filled"
            )
        ],
        []
    );

    const filters = [
        {
            key: "sort",
            label: "Sort",
            value: sortFilter,
            onChange: (val: string) => setSortFilter(val as HackathonSort),
            options: [
                { label: "Newest", value: "newest" },
                { label: "Oldest", value: "oldest" },
                { label: "A-Z", value: "title_asc" },
                { label: "Z-A", value: "title_desc" }
            ]
        }
    ];

    return (
        <Container>
            <Header>
                <Title>{m["admin.hackathons.page.title"]()}</Title>
            </Header>

            <AdminTable
                columns={columns}
                data={rows}
                loading={loading}
                onReload={() => load(true)}
                reloadLabel={m["admin.hackathons.list.reload"]()}
                filters={filters}
                headerActions={
                    <>
                        <AddButton onClick={() => router.push("/admin/hackathons/create")} disabled={!canCreate}>
                            {m["admin.hackathons.list.create"]()}
                        </AddButton>
                        {canManage && (
                            <FormControlLabel
                                control={<Checkbox checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} />}
                                label={m["admin.hackathons.list.showDeleted"]()}
                            />
                        )}
                    </>
                }
                rowActions={(row) => (
                    <>
                        <ManageButton
                            onClick={() => router.push(`/admin/hackathons/${row._id}`)}
                            ariaLabel="Manage hackathon"
                            iconSize={20}
                            disabled={!row.isActive || ability.cannot("read", `admin.hackathons.${row._id}`)}
                        />
                        {row.isActive && ability.canUpdateAnyField(`admin.hackathons.${row._id}`, row) ? (
                            <EditButton onClick={() => router.push(`/admin/hackathons/edit/${row._id}`)} ariaLabel="Edit hackathon" iconSize={20} />
                        ) : (
                            <ViewButton
                                onClick={() => router.push(`/admin/hackathons/edit/${row._id}`)}
                                ariaLabel="View hackathon"
                                iconSize={20}
                                disabled={ability.cannot("read", `admin.hackathons.${row._id}`)}
                            />
                        )}
                        {ability.can("manage", `admin.hackathons.${row._id}`) && !row.isActive ? (
                            <RestoreButton onClick={() => handleRestore(row._id)} ariaLabel="Restore hackathon" iconSize={20} />
                        ) : (
                            <DeleteButton
                                onClick={() => handleDelete(row._id)}
                                ariaLabel="Delete hackathon"
                                iconSize={20}
                                disabled={!row.isActive || ability.cannot("delete", `admin.hackathons.${row._id}`)}
                            />
                        )}
                    </>
                )}
                search={{
                    value: search,
                    onChange: setSearch,
                    placeholder: m["admin.hackathons.list.search"]()
                }}
                emptyMessage={m["admin.hackathons.list.noHackathons"]()}
                noResultsMessage={m["admin.hackathons.list.noResults"]()}
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
