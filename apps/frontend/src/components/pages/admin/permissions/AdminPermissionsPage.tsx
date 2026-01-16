"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "#/lib/eden";
import { AdminTable } from "#/components/pages/admin/AdminTable";
import { textColumn, chipColumn } from "#/components/pages/admin/AdminTableFactories";
import { AddButton, EditButton, DeleteButton, ViewButton, RestoreButton } from "#/components/Buttons";
import { newErrorToast, newInfoToast, newSuccessToast } from "#/components/Toast";
import { usePermissions } from "#/providers/PermissionsProvider";
import { FormControlLabel, Checkbox } from "@mui/material";
import * as m from "#/paraglide/messages";
import { Container, Header, Title } from "#/components/pages/admin/AdminPage.styles";

export type AdminPermissionTemplate = NonNullable<Awaited<ReturnType<typeof api.admin.permissions.get>>["data"]>[number];

export function AdminPermissionsPage() {
    const router = useRouter();
    const { ability } = usePermissions();
    const [rows, setRows] = useState<AdminPermissionTemplate[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [includeInactive, setIncludeInactive] = useState(false);

    const canCreate = ability.can("create", "admin.permissions");
    const canManage = ability.can("manage", "admin.permissions");

    const filteredRows = useMemo(() => {
        let result = rows;
        if (!includeInactive) {
            result = result.filter((r) => r.isActive);
        }
        if (search) {
            result = result.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase()));
        }
        return result;
    }, [rows, search, includeInactive]);

    const load = useCallback(async (notify?: boolean) => {
        try {
            setLoading(true);
            const { data, error } = await api.admin.permissions.get();

            if (!error && data) {
                setRows(data);
                if (notify) {
                    newInfoToast(m["admin.permissions.list.toasts.reloaded"]());
                }
            } else {
                throw new Error(m["admin.permissions.list.toasts.loadError"]());
            }
        } catch (e) {
            console.error("Failed to load permission templates:", e);
            setRows([]);
            newErrorToast(m["admin.permissions.list.toasts.loadError"]());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleDelete = async (id: string) => {
        try {
            const { error } = await api.admin.permissions({ id }).delete();

            if (!error) {
                newSuccessToast(m["admin.permissions.list.toasts.deleteSuccess"]());
                load();
            } else {
                throw new Error("Failed to delete permission template");
            }
        } catch (e) {
            console.error("Delete error:", e);
            newErrorToast(m["admin.permissions.list.toasts.deleteError"]());
        }
    };

    const handleRestore = async (id: string) => {
        try {
            const { error } = await api.admin.permissions({ id }).patch({ isActive: true });

            if (!error) {
                newSuccessToast(m["admin.permissions.list.toasts.restoreSuccess"]());
                load();
            } else {
                throw new Error("Failed to restore permission template");
            }
        } catch (e) {
            console.error("Restore error:", e);
            newErrorToast(m["admin.permissions.list.toasts.restoreError"]());
        }
    };

    const columns = useMemo(
        () => [
            textColumn<AdminPermissionTemplate>("name", m["admin.permissions.form.name"](), (r) => r.name, {
                bold: true,
                subValue: (r) => r.description || m["admin.permissions.list.noTemplates"]()
            }),
            chipColumn<AdminPermissionTemplate, string>(
                "isActive",
                m["admin.permissions.list.columns.status"](),
                (r) => (r.isActive ? "active" : "inactive"),
                (status) => m[`admin.permissions.list.status_${status as "active" | "inactive"}`](),
                (status) => (status === "active" ? "success" : "error"),
                "filled"
            ),
            textColumn<AdminPermissionTemplate>("rulesCount", m["admin.permissions.list.columns.rules"](), (r) => `${r.permissions.length} rules`)
        ],
        []
    );

    return (
        <Container>
            <Header>
                <Title>{m["admin.permissions.page.title"]()}</Title>
            </Header>

            <AdminTable
                columns={columns}
                data={filteredRows}
                loading={loading}
                onReload={() => load(true)}
                reloadLabel={m["admin.permissions.list.reload"]()}
                headerActions={
                    <>
                        <AddButton onClick={() => router.push("/admin/permissions/create")} disabled={!canCreate}>
                            {m["admin.permissions.list.create"]()}
                        </AddButton>
                        {canManage && (
                            <FormControlLabel
                                control={<Checkbox checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} />}
                                label={m["admin.permissions.list.showDeleted"]()}
                            />
                        )}
                    </>
                }
                rowActions={(row) => (
                    <>
                        {row.isActive && ability.canUpdateAnyField(`admin.permissions.${row._id}`, row) ? (
                            <EditButton onClick={() => router.push(`/admin/permissions/${row._id}`)} ariaLabel="Edit template" iconSize={20} />
                        ) : (
                            <ViewButton
                                onClick={() => router.push(`/admin/permissions/${row._id}`)}
                                ariaLabel="View template"
                                iconSize={20}
                                disabled={ability.cannot("read", `admin.permissions.${row._id}`)}
                            />
                        )}
                        {ability.can("manage", `admin.permissions.${row._id}`) && !row.isActive ? (
                            <RestoreButton onClick={() => handleRestore(row._id!)} ariaLabel="Restore template" iconSize={20} />
                        ) : (
                            <DeleteButton
                                onClick={() => handleDelete(row._id)}
                                disabled={!row.isActive || ability.cannot("delete", `admin.permissions.${row._id}`)}
                                iconSize={20}
                                ariaLabel="Delete template"
                            />
                        )}
                    </>
                )}
                search={{
                    value: search,
                    onChange: (val) => setSearch(val),
                    placeholder: m["admin.permissions.list.search"]()
                }}
                emptyMessage={m["admin.permissions.list.noTemplates"]()}
                noResultsMessage={m["admin.permissions.list.noResults"]()}
            />
        </Container>
    );
}
