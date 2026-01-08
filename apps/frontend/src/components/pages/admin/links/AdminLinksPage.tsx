"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "#/lib/eden";
import { AdminTable } from "#/components/pages/admin/AdminTable";
import { textColumn, chipColumn, customColumn } from "#/components/pages/admin/AdminTableFactories";
import { AddButton, EditButton, DeleteButton, CopyButton, RestoreButton, ViewButton } from "#/components/Buttons";
import { newErrorToast, newInfoToast, newSuccessToast } from "#/components/Toast";
import { usePermissions } from "#/providers/PermissionsProvider";
import { FormControlLabel, Checkbox } from "@mui/material";
import * as m from "#/paraglide/messages";
import { Container, Header, Title } from "#/components/pages/admin/AdminPage.styles";
import { LinkDestination } from "./AdminLinksPage.styles";

export type AdminLink = NonNullable<Awaited<ReturnType<typeof api.admin.links.get>>["data"]>["items"][number];

export function AdminLinksPage() {
    const router = useRouter();
    const { ability } = usePermissions();
    const [rows, setRows] = useState<AdminLink[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [includeInactive, setIncludeInactive] = useState(false);
    const PAGE_SIZE = 50;

    const canCreate = ability.can("create", "admin.links");
    const canManage = ability.can("manage", "admin.links");

    const load = useCallback(
        async (notify?: boolean) => {
            try {
                setLoading(true);
                const { data, error } = await api.admin.links.get({
                    query: {
                        search: search || undefined,
                        page,
                        pageSize: PAGE_SIZE,
                        includeInactive
                    }
                });

                if (!error && data) {
                    setRows(data.items);
                    setTotal(data.total);
                    if (notify) {
                        newInfoToast(m["admin.links.list.toasts.reloaded"]());
                    }
                } else {
                    throw new Error("Failed to load links");
                }
            } catch (e) {
                console.error("Failed to load links:", e);
                setRows([]);
                newErrorToast(m["admin.links.list.toasts.loadError"]());
            } finally {
                setLoading(false);
            }
        },
        [search, page, includeInactive]
    );

    useEffect(() => {
        load();
    }, [load]);

    const handleDelete = async (id: string) => {
        try {
            const { error } = await api.admin.links({ id }).delete();

            if (!error) {
                newSuccessToast(m["admin.links.list.toasts.deleteSuccess"]());
                load();
            } else {
                throw new Error("Failed to delete link");
            }
        } catch (e) {
            console.error("Delete error:", e);
            newErrorToast(e instanceof Error ? e.message : m["admin.links.list.toasts.deleteError"]());
        }
    };

    const handleRestore = async (id: string) => {
        try {
            const { error } = await api.admin.links({ id }).patch({ isActive: true });

            if (!error) {
                newSuccessToast(m["admin.links.list.toasts.restoreSuccess"]());
                load();
            } else {
                throw new Error("Failed to restore link");
            }
        } catch (e) {
            console.error("Restore error:", e);
            newErrorToast(e instanceof Error ? e.message : m["admin.links.list.toasts.restoreError"]());
        }
    };

    const columns = useMemo(
        () => [
            textColumn<AdminLink>("slug", m["admin.links.form.slug"](), (r) => `/${r.slug}`, {
                bold: true
            }),
            textColumn<AdminLink>("title", m["admin.links.form.title"](), (r) => r.title, {
                bold: true,
                subValue: (r) => r.description
            }),
            customColumn<AdminLink>("destination", m["admin.links.form.destination"](), (r) => (
                <LinkDestination href={r.destination} target="_blank" rel="noopener">
                    {r.destination}
                </LinkDestination>
            )),
            chipColumn<AdminLink, "active" | "inactive">(
                "status",
                m["admin.links.list.columns.status"](),
                (r) => (r.isActive ? "active" : "inactive"),
                (status) => m[`admin.links.list.status_${status}`](),
                (status) => (status === "active" ? "success" : "error"),
                "filled"
            ),
            textColumn<AdminLink>("clicks", m["admin.links.list.columns.clicks"](), (r) => r.clicks.toLocaleString())
        ],
        []
    );

    return (
        <Container>
            <Header>
                <Title>{m["admin.links.page.title"]()}</Title>
            </Header>

            <AdminTable
                columns={columns}
                data={rows}
                loading={loading}
                onReload={() => load(true)}
                reloadLabel={m["admin.links.list.reload"]()}
                headerActions={
                    <>
                        <AddButton onClick={() => router.push("/admin/links/create")} disabled={!canCreate}>
                            {m["admin.links.list.create"]()}
                        </AddButton>
                        {canManage && (
                            <FormControlLabel
                                control={<Checkbox checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} />}
                                label={m["admin.links.list.showDeleted"]()}
                            />
                        )}
                    </>
                }
                rowActions={(row) => (
                    <>
                        <CopyButton
                            content={`${typeof window !== "undefined" ? window.location.origin : ""}/link/${row.slug || ""}`}
                            ariaLabel="Copy link URL"
                            iconSize={20}
                        />
                        {row.isActive &&
                        (ability.can("update", `admin.links.${row._id!}`) ||
                            ability.can("update", "admin.links") ||
                            ability.canUpdateAnyField(`admin.links.${row._id!}`, row)) ? (
                            <EditButton onClick={() => router.push(`/admin/links/${row._id!}`)} ariaLabel="Edit link" iconSize={20} />
                        ) : (
                            <ViewButton onClick={() => router.push(`/admin/links/${row._id!}`)} ariaLabel="View link" iconSize={20} />
                        )}
                        {ability.can("manage", `admin.links.${row._id!}`) && !row.isActive ? (
                            <RestoreButton onClick={() => handleRestore(row._id!)} ariaLabel="Restore link" iconSize={20} />
                        ) : (
                            <DeleteButton
                                onClick={() => handleDelete(row._id!)}
                                ariaLabel="Delete link"
                                iconSize={20}
                                disabled={!row.isActive || ability.cannot("delete", `admin.links.${row._id!}`)}
                            />
                        )}
                    </>
                )}
                search={{
                    value: search,
                    onChange: setSearch,
                    placeholder: m["admin.links.list.search"]()
                }}
                emptyMessage={m["admin.links.list.noLinks"]()}
                noResultsMessage={m["admin.links.list.noResults"]()}
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
