"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "#/lib/eden";
import { AdminTable } from "#/components/pages/admin/AdminTable";
import { textColumn, chipColumn } from "#/components/pages/admin/AdminTableFactories";
import { AddButton, EditButton, DeleteButton, RestoreButton, ViewButton, CopyButton } from "#/components/Buttons";
import { newErrorToast, newSuccessToast } from "#/components/Toast";
import { usePermissions } from "#/providers/PermissionsProvider";
import { FormControlLabel, Checkbox } from "@mui/material";
import * as m from "#/paraglide/messages";
import { Container, Header, Title } from "#/components/pages/admin/AdminPage.styles";

export type AdminCertificateTemplate = NonNullable<Awaited<ReturnType<typeof api.admin.certificates.templates.get>>["data"]>["items"][number];

interface TeamCertificateTemplatesPageProps {
    hackathonId: string;
    teamId: string;
    hackathon: any;
    team: any;
}

const PAGE_SIZE = 20;

export function TeamCertificateTemplatesPage({ hackathonId, teamId, hackathon, team }: TeamCertificateTemplatesPageProps) {
    const router = useRouter();
    const { ability } = usePermissions();
    const [templates, setTemplates] = useState<AdminCertificateTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [includeDeleted, setIncludeDeleted] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await api.admin.certificates.templates.get({
                query: {
                    page,
                    pageSize: PAGE_SIZE,
                    search: search || undefined,
                    includeInactive: includeDeleted,
                    teamId,
                    hackathonId
                }
            });

            if (data && !error) {
                setTemplates(data.items);
                setTotal(data.total);
            } else {
                newErrorToast(m["admin.hackathons.teams.certificates.toasts.error"]());
            }
        } catch (e) {
            console.error("Load error:", e);
            newErrorToast(m["admin.hackathons.teams.certificates.toasts.error"]());
        } finally {
            setLoading(false);
        }
    }, [page, search, includeDeleted, teamId]);

    useEffect(() => {
        load();
    }, [load]);

    const generateCopyContent = async (row: AdminCertificateTemplate) => {
        const { data } = await api.admin.certificates.get({
            query: { templateId: row._id, pageSize: 100 }
        });
        const items = data?.items || [];
        const groupName = (row.metadata as any)?.group || team.name || "Certificates";
        const header = `${groupName}\n-------------------------------\n\n`;
        const body = items.map((c) => `${c.recipient.name} - ${window.location.origin}/cert/${c._id}`).join("\n");
        return header + body;
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await api.admin.certificates.templates({ id }).delete();
            if (!error) {
                newSuccessToast(m["admin.hackathons.teams.certificates.toasts.deleted"]());
                load();
            } else {
                throw new Error("Failed to delete template");
            }
        } catch (e) {
            console.error("Delete error:", e);
            newErrorToast(m["admin.hackathons.teams.certificates.toasts.error"]());
        }
    };

    const handleRestore = async (id: string) => {
        try {
            const { error } = await api.admin.certificates.templates({ id }).patch({ isActive: true });
            if (!error) {
                newSuccessToast(m["admin.hackathons.teams.certificates.toasts.updated"]());
                load();
            } else {
                throw new Error("Failed to restore template");
            }
        } catch (e) {
            console.error("Restore error:", e);
            newErrorToast(m["admin.hackathons.teams.certificates.toasts.error"]());
        }
    };

    const columns = useMemo(
        () => [
            textColumn<AdminCertificateTemplate>("title", "Title", (r) => r.title, {
                bold: true,
                noTranslate: true
            }),
            textColumn<AdminCertificateTemplate>("type", m["admin.hackathons.teams.certificates.list.columns.type"](), (r) => {
                const msgKey = `admin.certificates.types.${r.type}` as keyof typeof m;
                return typeof m[msgKey] === "function" ? (m[msgKey] as any)() : r.type;
            }),
            textColumn<AdminCertificateTemplate>(
                "recipients",
                m["admin.hackathons.teams.certificates.list.columns.recipients"](),
                (r) => `${r.recipients?.length || 0} recipients`,
                { noTranslate: true }
            ),
            chipColumn<AdminCertificateTemplate, "active" | "deleted">(
                "status",
                m["admin.hackathons.teams.certificates.list.columns.status"](),
                (r) => (r.isActive ? "active" : "deleted"),
                (status) => m[`admin.hackathons.teams.certificates.list.status_${status}`](),
                (status) => (status === "active" ? "success" : "error"),
                "filled"
            )
        ],
        []
    );

    const baseUrl = `/admin/hackathons/${hackathonId}/teams/${teamId}/certificates`;

    return (
        <Container>
            <Header>
                <Title>
                    {m["admin.hackathons.teams.certificates.page.title"]()} - {team.name}
                </Title>
            </Header>
            <AdminTable<AdminCertificateTemplate>
                columns={columns}
                data={templates}
                loading={loading}
                onReload={load}
                headerActions={
                    <>
                        {ability.can("create", `admin.hackathons.${hackathonId}.teams.${teamId}.certificates`) && (
                            <AddButton onClick={() => router.push(`${baseUrl}/create`)} ariaLabel="Create certificate template">
                                {m["admin.hackathons.teams.certificates.list.addButton"]()}
                            </AddButton>
                        )}
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={includeDeleted}
                                    onChange={(e) => {
                                        setIncludeDeleted(e.target.checked);
                                        setPage(1);
                                    }}
                                    size="small"
                                />
                            }
                            label="Show deleted"
                            sx={{ mr: 2 }}
                        />
                    </>
                }
                rowActions={(row) => (
                    <>
                        <CopyButton content={() => generateCopyContent(row)} ariaLabel="Copy certificates list" iconSize={20} />
                        {row.isActive &&
                        team.isActive &&
                        hackathon.isActive &&
                        ability.canUpdateAnyField(`admin.hackathons.${hackathonId}.teams.${teamId}.certificates.templates.${row._id}`, row) ? (
                            <EditButton onClick={() => router.push(`${baseUrl}/${row._id}`)} ariaLabel="Edit template" iconSize={20} />
                        ) : (
                            <ViewButton
                                onClick={() => router.push(`${baseUrl}/${row._id}`)}
                                ariaLabel="View template"
                                iconSize={20}
                                disabled={ability.cannot("read", `admin.hackathons.${hackathonId}.teams.${teamId}.certificates.templates.${row._id}`)}
                            />
                        )}
                        {ability.can("manage", `admin.hackathons.${hackathonId}.teams.${teamId}.certificates.templates.${row._id}`) && !row.isActive ? (
                            <RestoreButton
                                onClick={() => handleRestore(row._id)}
                                ariaLabel="Restore template"
                                iconSize={20}
                                disabled={!team.isActive || !hackathon.isActive}
                            />
                        ) : (
                            <DeleteButton
                                onClick={() => handleDelete(row._id)}
                                ariaLabel="Delete template"
                                iconSize={20}
                                disabled={
                                    !row.isActive ||
                                    ability.cannot("delete", `admin.hackathons.${hackathonId}.teams.${teamId}.certificates.templates.${row._id}`) ||
                                    !team.isActive ||
                                    !hackathon.isActive
                                }
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
                    placeholder: m["admin.hackathons.teams.certificates.list.search"]()
                }}
                emptyMessage={m["admin.hackathons.teams.certificates.list.noTemplates"]()}
                noResultsMessage={m["admin.hackathons.teams.certificates.list.noResults"]()}
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
