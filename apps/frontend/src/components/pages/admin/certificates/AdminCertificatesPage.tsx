"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "#/lib/eden";
import { AdminTable } from "#/components/pages/admin/AdminTable";
import { textColumn, chipColumn } from "#/components/pages/admin/AdminTableFactories";
import { AddButton, EditButton, DeleteButton, RestoreButton, ViewButton, CancelButton, AcceptButton } from "#/components/Buttons";
import { newErrorToast, newInfoToast, newSuccessToast } from "#/components/Toast";
import { usePermissions } from "#/providers/PermissionsProvider";
import { FormControlLabel, Checkbox, Box } from "@mui/material";
import * as m from "#/paraglide/messages";
import { Container, Header, Title } from "#/components/pages/admin/AdminPage.styles";

export type AdminCertificate = NonNullable<Awaited<ReturnType<typeof api.admin.certificates.get>>["data"]>["items"][number];

export function AdminCertificatesPage() {
    const router = useRouter();
    const { ability } = usePermissions();
    const [rows, setRows] = useState<AdminCertificate[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [includeInactive, setIncludeInactive] = useState(false);

    // Filters
    const [typeFilter, setTypeFilter] = useState<string | "all">("all");
    const [sortFilter, setSortFilter] = useState<string>("newest");

    const PAGE_SIZE = 50;

    const canCreate = ability.can("create", "admin.certificates");
    const canManage = ability.can("manage", "admin.certificates");

    const load = useCallback(
        async (notify?: boolean) => {
            try {
                setLoading(true);
                const { data, error } = await api.admin.certificates.get({
                    query: {
                        page,
                        pageSize: PAGE_SIZE,
                        search: search || undefined,
                        includeInactive: includeInactive && canManage,
                        type: typeFilter === "all" ? undefined : typeFilter,
                        sort: sortFilter
                    }
                });

                if (!error && data) {
                    setRows(data.items);
                    setTotal(data.total);
                    if (notify) {
                        newInfoToast(m["admin.certificates.list.reload"]());
                    }
                } else {
                    throw new Error("Failed to load certificates");
                }
            } catch (e) {
                console.error("Failed to load certificates:", e);
                setRows([]);
                newErrorToast(m["admin.certificates.toasts.error"]());
            } finally {
                setLoading(false);
            }
        },
        [page, search, includeInactive, canManage, typeFilter, sortFilter]
    );

    useEffect(() => {
        load();
    }, [load]);

    const handleDelete = async (id: string) => {
        try {
            const { error } = await api.admin.certificates({ id }).delete();

            if (!error) {
                newSuccessToast(m["admin.certificates.toasts.deleted"]());
                load();
            } else {
                throw new Error("Failed to delete certificate");
            }
        } catch (e) {
            console.error("Delete error:", e);
            newErrorToast(e instanceof Error ? e.message : m["admin.certificates.toasts.error"]());
        }
    };

    const handleRestore = async (id: string) => {
        try {
            const { error } = await api.admin.certificates({ id }).patch({ isActive: true });

            if (!error) {
                newSuccessToast(m["admin.certificates.toasts.updated"]());
                load();
            } else {
                throw new Error("Failed to restore certificate");
            }
        } catch (e) {
            console.error("Restore error:", e);
            newErrorToast(e instanceof Error ? e.message : m["admin.certificates.toasts.error"]());
        }
    };

    const handleRevoke = async (id: string) => {
        try {
            const { error } = await api.admin.certificates({ id }).patch({ revoked: true });

            if (!error) {
                newSuccessToast(m["admin.certificates.toasts.revoked"]());
                load();
            } else {
                throw new Error("Failed to revoke certificate");
            }
        } catch (e) {
            console.error("Revoke error:", e);
            newErrorToast(e instanceof Error ? e.message : m["admin.certificates.toasts.error"]());
        }
    };

    const handleUnrevoke = async (id: string) => {
        try {
            const { error } = await api.admin.certificates({ id }).patch({ revoked: false });

            if (!error) {
                newSuccessToast(m["admin.certificates.toasts.unrevoked"]());
                load();
            } else {
                throw new Error("Failed to unrevoke certificate");
            }
        } catch (e) {
            console.error("Unrevoke error:", e);
            newErrorToast(e instanceof Error ? e.message : m["admin.certificates.toasts.error"]());
        }
    };

    const columns = useMemo(
        () => [
            textColumn<AdminCertificate>("recipient", m["admin.certificates.list.columns.recipient"](), (r) => r.recipient.name, {
                bold: true,
                subValue: (r) => r._id
            }),
            textColumn<AdminCertificate>("type", m["admin.certificates.list.columns.type"](), (r) => {
                const msgKey = `admin.certificates.types.${r.type}` as keyof typeof m;
                return typeof m[msgKey] === "function" ? (m[msgKey] as any)() : r.type;
            }),
            chipColumn<AdminCertificate, "manual" | "auto">(
                "source",
                m["admin.certificates.list.columns.source"](),
                (r) => r.source || "manual",
                (source) => m[`admin.certificates.list.source_${source}`](),
                (source) => (source === "manual" ? "primary" : "secondary"),
                "outlined"
            ),
            chipColumn<AdminCertificate, "active" | "revoked" | "deleted">(
                "status",
                m["admin.certificates.list.columns.status"](),
                (r) => (r.isActive ? (r.revoked ? "revoked" : "active") : "deleted"),
                (status) => {
                    return m[`admin.certificates.list.status_${status}`]();
                },
                (status) => (status === "active" ? "success" : status === "deleted" ? "error" : "warning"),
                "filled"
            )
        ],
        []
    );

    const filters = [
        {
            key: "type",
            label: m["admin.certificates.list.columns.type"](),
            value: typeFilter,
            onChange: (val: string) => {
                setTypeFilter(val);
                setPage(1);
            },
            options: [
                { label: "All", value: "all" },
                { label: m["admin.certificates.types.COURSE_COMPLETION"](), value: "COURSE_COMPLETION" },
                { label: m["admin.certificates.types.PARTICIPATION"](), value: "PARTICIPATION" },
                { label: m["admin.certificates.types.VOLUNTEER"](), value: "VOLUNTEER" },
                { label: m["admin.certificates.types.EVENT_ACHIEVEMENT"](), value: "EVENT_ACHIEVEMENT" }
            ]
        },
        {
            key: "sort",
            label: "Sort",
            value: sortFilter,
            onChange: (val: string) => {
                setSortFilter(val);
                setPage(1);
            },
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
                <Title>{m["admin.certificates.title"]()}</Title>
            </Header>

            <AdminTable
                columns={columns}
                data={rows}
                loading={loading}
                onReload={() => load(true)}
                reloadLabel={m["admin.certificates.list.reload"]()}
                filters={filters}
                headerActions={
                    <>
                        <AddButton onClick={() => router.push("/admin/certificates/create")} disabled={!canCreate}>
                            {m["admin.certificates.page.createTitle"]()}
                        </AddButton>
                        {canManage && (
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={includeInactive}
                                        onChange={(e) => {
                                            setIncludeInactive(e.target.checked);
                                            setPage(1);
                                        }}
                                    />
                                }
                                label={m["admin.certificates.list.showDeleted"]()}
                            />
                        )}
                    </>
                }
                rowActions={(row) => {
                    const canUpdateRevoked = ability.can("update", `admin.certificates.${row._id}`, { field: "revoked" });
                    return (
                        <>
                            {row.isActive && ability.canUpdateAnyField(`admin.certificates.${row._id}`, row) && row.source !== "auto" ? (
                                <EditButton onClick={() => router.push(`/admin/certificates/${row._id}`)} ariaLabel="Edit certificate" iconSize={20} />
                            ) : (
                                <ViewButton
                                    onClick={() => router.push(`/admin/certificates/${row._id}`)}
                                    ariaLabel="View certificate"
                                    iconSize={20}
                                    disabled={ability.cannot("read", `admin.certificates.${row._id}`)}
                                />
                            )}
                            {row.revoked ? (
                                <AcceptButton
                                    onClick={() => handleUnrevoke(row._id)}
                                    ariaLabel="Unrevoke certificate"
                                    iconSize={20}
                                    color="success"
                                    disabled={!row.isActive || !canUpdateRevoked || row.source === "auto"}
                                    confirmationDuration={750}
                                />
                            ) : (
                                <CancelButton
                                    onClick={() => handleRevoke(row._id)}
                                    ariaLabel="Revoke certificate"
                                    iconSize={20}
                                    disabled={!row.isActive || !canUpdateRevoked || row.source === "auto"}
                                    confirmationDuration={750}
                                />
                            )}
                            {ability.can("manage", `admin.certificates.${row._id}`) && !row.isActive ? (
                                <RestoreButton
                                    onClick={() => handleRestore(row._id)}
                                    ariaLabel="Restore certificate"
                                    iconSize={20}
                                    disabled={row.source === "auto"}
                                />
                            ) : (
                                <DeleteButton
                                    onClick={() => handleDelete(row._id)}
                                    ariaLabel="Delete certificate"
                                    iconSize={20}
                                    disabled={!row.isActive || ability.cannot("delete", `admin.certificates.${row._id}`) || row.source === "auto"}
                                />
                            )}
                        </>
                    );
                }}
                search={{
                    value: search,
                    onChange: (val) => {
                        setSearch(val);
                        setPage(1);
                    },
                    placeholder: m["admin.certificates.list.search"]()
                }}
                emptyMessage={m["admin.certificates.list.noCertificates"]()}
                noResultsMessage={m["admin.certificates.list.noResults"]()}
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
