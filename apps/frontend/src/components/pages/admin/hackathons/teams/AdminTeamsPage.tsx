"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "#/lib/eden";
import { AdminTable } from "#/components/pages/admin/AdminTable";
import { textColumn, chipColumn, customColumn } from "#/components/pages/admin/AdminTableFactories";
import { AddButton, EditButton, DeleteButton, RestoreButton, ViewButton, ReloadButton, CertificateButton } from "#/components/Buttons";
import { newErrorToast, newInfoToast, newSuccessToast } from "#/components/Toast";
import { usePermissions } from "#/providers/PermissionsProvider";
import { FormControlLabel, Checkbox } from "@mui/material";
import * as m from "#/paraglide/messages";
import { Container, Header, Title } from "#/components/pages/admin/AdminPage.styles";
import UserMention from "#/components/markdown/components/UserMention";
import { AdminHackathon } from "../AdminHackathonsPage";
import { AdminTrack } from "../tracks/AdminTracksPage";

interface AdminTeam {
    _id: string;
    name: string;
    hackathonId: string;
    trackId: string | null;
    password?: string;
    projectDescription?: string;
    users: string[];
    isActive: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

interface AdminTeamsPageProps {
    hackathonId: string;
    hackathon?: AdminHackathon;
}

export function AdminTeamsPage({ hackathonId, hackathon }: AdminTeamsPageProps) {
    const router = useRouter();
    const { ability } = usePermissions();
    const [rows, setRows] = useState<AdminTeam[]>([]);
    const [tracks, setTracks] = useState<AdminTrack[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [includeInactive, setIncludeInactive] = useState(false);
    const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});

    const PAGE_SIZE = 50;
    const resourceBase = `admin.hackathons.${hackathonId}.teams`;
    const canCreate = ability.can("create", resourceBase) && hackathon?.isActive !== false;
    const canManage = ability.can("manage", resourceBase);

    const loadTracks = useCallback(async () => {
        try {
            const { data } = await api.admin.hackathons({ id: hackathonId }).tracks.get();
            if (data) setTracks(data.items);
        } catch (e) {
            console.error("Failed to load tracks:", e);
        }
    }, [hackathonId]);

    const loadTeams = useCallback(
        async (notify?: boolean) => {
            try {
                setLoading(true);
                const { data, error } = await api.admin.teams.get({
                    query: {
                        hackathonId,
                        page,
                        pageSize: PAGE_SIZE,
                        search: search || undefined,
                        includeInactive: includeInactive && canManage
                    }
                });

                if (!error && data) {
                    setRows(data.items as any);
                    setTotal(data.total);
                    if (notify) {
                        newInfoToast(m["admin.hackathons.teams.list.toasts.reloaded"]());
                    }
                } else {
                    throw new Error("Failed to load teams");
                }
            } catch (e) {
                console.error("Failed to load teams:", e);
                setRows([]);
                newErrorToast(m["admin.hackathons.teams.list.toasts.loadError"]());
            } finally {
                setLoading(false);
            }
        },
        [hackathonId, page, search, includeInactive, canManage]
    );

    useEffect(() => {
        loadTracks();
        loadTeams();
    }, [loadTracks, loadTeams]);

    const handleDelete = async (teamId: string) => {
        try {
            const { error } = await api.admin.teams({ id: teamId }).delete();
            if (!error) {
                newSuccessToast(m["admin.hackathons.teams.list.toasts.deleteSuccess"]());
                loadTeams();
            } else {
                throw new Error("Failed to delete team");
            }
        } catch (e) {
            console.error("Delete error:", e);
            newErrorToast(m["admin.hackathons.teams.list.toasts.deleteError"]());
        }
    };

    const handleRestore = async (teamId: string) => {
        try {
            const { error } = await api.admin.teams({ id: teamId }).patch({ isActive: true });
            if (!error) {
                newSuccessToast(m["admin.hackathons.teams.list.toasts.restoreSuccess"]());
                loadTeams();
            } else {
                throw new Error("Failed to restore team");
            }
        } catch (e) {
            console.error("Restore error:", e);
            newErrorToast(m["admin.hackathons.teams.list.toasts.restoreError"]());
        }
    };

    const handleViewPassword = async (teamId: string) => {
        try {
            const { data, error } = await api.admin.teams({ id: teamId }).password.get();
            if (data && !error) {
                setRevealedPasswords((prev) => ({ ...prev, [teamId]: data.password }));
            }
        } catch (e) {
            console.error("View password error:", e);
        }
    };

    const handleReloadPassword = async (teamId: string) => {
        try {
            const { data, error } = await api.admin.teams({ id: teamId }).password.reload.post();
            if (data && !error) {
                setRevealedPasswords((prev) => ({ ...prev, [teamId]: data.password }));
                newSuccessToast(m["admin.hackathons.teams.list.toasts.passwordReloaded"]());
                loadTeams();
            }
        } catch (e) {
            console.error("Reload password error:", e);
            newErrorToast(m["admin.hackathons.teams.list.toasts.passwordReloadError"]());
        }
    };

    const columns = useMemo(
        () => [
            textColumn<AdminTeam>("name", m["admin.hackathons.teams.fields.name"](), (r) => r.name, { bold: true, noTranslate: true }),
            textColumn<AdminTeam>("track", m["admin.hackathons.teams.fields.track"](), (r) => {
                if (!r.trackId) return "-";
                const track = tracks.find((t) => t._id === r.trackId);
                return track ? track.name : r.trackId;
            }, {noTranslate: true}),
            customColumn<AdminTeam>("password", m["admin.hackathons.teams.list.columns.password"](), (r) => {
                const resource = `admin.hackathons.${hackathonId}.teams.${r._id}`;
                const canRead = ability.can("read", resource, { field: "password" });
                const canReload = ability.can("update", resource, { field: "password" });
                const revealed = revealedPasswords[r._id];

                return (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <code style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: "4px", fontSize: "14px" }} data-no-ai-translate>{revealed || "********"}</code>
                        {canRead && !revealed && <ViewButton onClick={() => handleViewPassword(r._id)} slim iconSize={16} disabled={!r.isActive} />}
                        {canReload && <ReloadButton onClick={() => handleReloadPassword(r._id)} slim iconSize={16} disabled={!r.isActive} />}
                    </div>
                );
            }),
            customColumn<AdminTeam>("members", m["admin.hackathons.teams.list.columns.members"](), (r) => (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }} data-no-ai-translate>
                    {r.users.map((u: string, i: number) => {
                        const isId = /^[0-9a-fA-F]{24}$/.test(u);
                        return (
                            <span key={i}>
                                {isId ? <UserMention userId={u} isAdmin /> : u}
                                {i < r.users.length - 1 && ", "}
                            </span>
                        );
                    })}
                </div>
            )),
            chipColumn<AdminTeam, "active" | "inactive">(
                "status",
                "Status",
                (r) => (r.isActive ? "active" : "inactive"),
                (status) => status.charAt(0).toUpperCase() + status.slice(1),
                (status) => (status === "active" ? "success" : "error"),
                "filled"
            )
        ],
        [tracks, revealedPasswords, ability, hackathonId]
    );

    return (
        <Container>
            <Header>
                <Title>{m["admin.hackathons.teams.title"]()}</Title>
            </Header>

            <AdminTable
                columns={columns}
                data={rows}
                loading={loading}
                onReload={() => loadTeams(true)}
                reloadLabel={m["admin.hackathons.teams.list.reload"]()}
                emptyMessage={m["admin.hackathons.teams.list.noTeams"]()}
                noResultsMessage={m["admin.hackathons.teams.list.noResults"]()}
                headerActions={
                    <>
                        <AddButton onClick={() => router.push(`/admin/hackathons/${hackathonId}/teams/create`)} disabled={!canCreate}>
                            {m["admin.hackathons.teams.page.createTitle"]()}
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
                                label={m["admin.hackathons.teams.list.showDeleted"]()}
                            />
                        )}
                    </>
                }
                rowActions={(row) => {
                    const hackathonInactive = hackathon?.isActive === false;
                    const canEditRow = row.isActive && !hackathonInactive && ability.canUpdateAnyField(`${resourceBase}.${row._id}`, row);

                    const canAccessCertificates = ability.hasSectionPermissions(`admin.hackathons.${hackathonId}.teams.${row._id}.certificates`);

                    return (
                        <>
                            {canAccessCertificates && (
                                <CertificateButton
                                    onClick={() => router.push(`/admin/hackathons/${hackathonId}/teams/${row._id}/certificates`)}
                                    ariaLabel="Manage certificates"
                                    iconSize={20}
                                />
                            )}
                            {canEditRow ? (
                                <EditButton
                                    onClick={() => router.push(`/admin/hackathons/${hackathonId}/teams/${row._id}`)}
                                    ariaLabel="Edit team"
                                    iconSize={20}
                                />
                            ) : (
                                <ViewButton
                                    onClick={() => router.push(`/admin/hackathons/${hackathonId}/teams/${row._id}`)}
                                    ariaLabel="View team"
                                    iconSize={20}
                                    disabled={ability.cannot("read", `${resourceBase}.${row._id}`)}
                                />
                            )}
                            {!row.isActive ? (
                                <RestoreButton
                                    onClick={() => handleRestore(row._id)}
                                    ariaLabel="Restore team"
                                    iconSize={20}
                                    disabled={hackathonInactive || !canManage}
                                />
                            ) : (
                                <DeleteButton
                                    onClick={() => handleDelete(row._id)}
                                    ariaLabel="Delete team"
                                    iconSize={20}
                                    disabled={hackathonInactive || !row.isActive || ability.cannot("delete", `${resourceBase}.${row._id}`)}
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
                    placeholder: m["admin.hackathons.teams.list.search"]()
                }}
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
