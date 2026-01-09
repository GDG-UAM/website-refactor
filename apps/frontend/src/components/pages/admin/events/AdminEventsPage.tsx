"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "#/lib/eden";
import { AdminTable } from "#/components/pages/admin/AdminTable";
import { textColumn, chipColumn, customColumn } from "#/components/pages/admin/AdminTableFactories";
import { AddButton, EditButton, DeleteButton, RestoreButton, ViewButton } from "#/components/Buttons";
import { newErrorToast, newInfoToast, newSuccessToast } from "#/components/Toast";
import { usePermissions } from "#/providers/PermissionsProvider";
import { FormControlLabel, Checkbox } from "@mui/material";
import * as m from "#/paraglide/messages";
import { Container, Header, Title } from "#/components/pages/admin/AdminPage.styles";
import { EventImage, EventDate, EventLocation } from "./AdminEventsPage.styles";

export type AdminEvent = NonNullable<Awaited<ReturnType<typeof api.admin.events.get>>["data"]>["items"][number];

export function AdminEventsPage() {
    const router = useRouter();
    const { ability } = usePermissions();
    const [rows, setRows] = useState<AdminEvent[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [includeInactive, setIncludeInactive] = useState(false);

    // Types derived from API
    type EventQuery = NonNullable<NonNullable<Parameters<typeof api.admin.events.get>[0]>["query"]>;
    type EventStatus = NonNullable<EventQuery["status"]>;
    type EventDateStatus = NonNullable<EventQuery["dateStatus"]>;
    type EventSort = NonNullable<EventQuery["sort"]>;

    // Filters
    const [statusFilter, setStatusFilter] = useState<EventStatus | "all">("all");
    const [dateFilter, setDateFilter] = useState<EventDateStatus | "all">("all");
    const [sortFilter, setSortFilter] = useState<EventSort>("newest");

    const PAGE_SIZE = 50;

    const canCreate = ability.can("create", "admin.events");
    const canManage = ability.can("manage", "admin.events");

    const load = useCallback(
        async (notify?: boolean) => {
            try {
                setLoading(true);
                const { data, error } = await api.admin.events.get({
                    query: {
                        status: statusFilter === "all" ? undefined : statusFilter,
                        dateStatus: dateFilter === "all" ? undefined : dateFilter,
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
                        newInfoToast(m["admin.events.list.toasts.reloaded"]());
                    }
                } else {
                    throw new Error("Failed to load events");
                }
            } catch (e) {
                console.error("Failed to load events:", e);
                setRows([]);
                newErrorToast(m["admin.events.list.toasts.loadError"]());
            } finally {
                setLoading(false);
            }
        },
        [statusFilter, dateFilter, sortFilter, page, search, includeInactive]
    );

    useEffect(() => {
        load();
    }, [load]);

    const handleDelete = async (id: string) => {
        try {
            const { error } = await api.admin.events({ id }).delete();

            if (!error) {
                newSuccessToast(m["admin.events.list.toasts.deleteSuccess"]());
                load();
            } else {
                throw new Error("Failed to delete event");
            }
        } catch (e) {
            console.error("Delete error:", e);
            newErrorToast(e instanceof Error ? e.message : m["admin.events.list.toasts.deleteError"]());
        }
    };

    const handleRestore = async (id: string) => {
        try {
            const { error } = await api.admin.events({ id }).patch({ isActive: true });

            if (!error) {
                newSuccessToast(m["admin.events.list.toasts.restoreSuccess"]());
                load();
            } else {
                throw new Error("Failed to restore event");
            }
        } catch (e) {
            console.error("Restore error:", e);
            newErrorToast(e instanceof Error ? e.message : m["admin.events.list.toasts.restoreError"]());
        }
    };

    const columns = useMemo(
        () => [
            customColumn<AdminEvent>("image", "", (r) => (r.image ? <EventImage src={r.image} alt={r.title} /> : null), { width: "60px" }),
            textColumn<AdminEvent>("title", m["admin.events.form.title"](), (r) => r.title, {
                bold: true,
                subValue: (r) => r.slug
            }),
            customColumn<AdminEvent>("date", m["admin.events.form.date"](), (r) => <EventDate>{new Date(r.date).toLocaleString()}</EventDate>),
            customColumn<AdminEvent>("location", m["admin.events.form.location"](), (r) => <EventLocation>{r.location}</EventLocation>),
            chipColumn<AdminEvent, "published" | "draft" | "deleted">(
                "status",
                m["admin.events.list.columns.status"](),
                (r) => (r.isActive ? r.status : "deleted"),
                (status) => m[`admin.events.list.status_${status}`](),
                (status) => (status === "published" ? "success" : status === "deleted" ? "error" : "warning"),
                "filled"
            )
        ],
        []
    );

    const filters = [
        {
            key: "status",
            label: m["admin.events.list.columns.status"](),
            value: statusFilter,
            onChange: (val: string) => setStatusFilter(val as EventStatus | "all"),
            options: [
                { label: "All", value: "all" },
                { label: "Draft", value: "draft" },
                { label: "Published", value: "published" }
            ]
        },
        {
            key: "date",
            label: "Date",
            value: dateFilter,
            onChange: (val: string) => setDateFilter(val as EventDateStatus | "all"),
            options: [
                { label: "All", value: "all" },
                { label: "Upcoming", value: "upcoming" },
                { label: "Past", value: "past" }
            ]
        },
        {
            key: "sort",
            label: "Sort",
            value: sortFilter,
            onChange: (val: string) => setSortFilter(val as EventSort),
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
                <Title>{m["admin.events.page.title"]()}</Title>
            </Header>

            <AdminTable
                columns={columns}
                data={rows}
                loading={loading}
                onReload={() => load(true)}
                reloadLabel={m["admin.events.list.reload"]()}
                filters={filters}
                headerActions={
                    <>
                        <AddButton onClick={() => router.push("/admin/events/create")} disabled={!canCreate}>
                            {m["admin.events.list.create"]()}
                        </AddButton>
                        {canManage && (
                            <FormControlLabel
                                control={<Checkbox checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} />}
                                label={m["admin.events.list.showDeleted"]()}
                            />
                        )}
                    </>
                }
                rowActions={(row) => (
                    <>
                        {row.isActive && ability.canUpdateAnyField(`admin.events.${row._id}`, row) ? (
                            <EditButton onClick={() => router.push(`/admin/events/${row._id}`)} ariaLabel="Edit event" iconSize={20} />
                        ) : (
                            <ViewButton
                                onClick={() => router.push(`/admin/events/${row._id}`)}
                                ariaLabel="View event"
                                iconSize={20}
                                disabled={ability.cannot("read", `admin.events.${row._id}`)}
                            />
                        )}
                        {ability.can("manage", `admin.events.${row._id}`) && !row.isActive ? (
                            <RestoreButton onClick={() => handleRestore(row._id)} ariaLabel="Restore event" iconSize={20} />
                        ) : (
                            <DeleteButton
                                onClick={() => handleDelete(row._id)}
                                ariaLabel="Delete event"
                                iconSize={20}
                                disabled={!row.isActive || ability.cannot("delete", `admin.events.${row._id}`)}
                            />
                        )}
                    </>
                )}
                search={{
                    value: search,
                    onChange: setSearch,
                    placeholder: m["admin.events.list.search"]()
                }}
                emptyMessage={m["admin.events.list.noEvents"]()}
                noResultsMessage={m["admin.events.list.noResults"]()}
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
