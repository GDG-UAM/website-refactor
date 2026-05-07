"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "#/lib/eden";
import { AdminTable } from "#/components/pages/admin/AdminTable";
import { textColumn, chipColumn, customColumn } from "#/components/pages/admin/AdminTableFactories";
import { AddButton, EditButton, DeleteButton, RestoreButton, ViewButton, LeaderboardButton } from "#/components/Buttons";
import { newErrorToast, newInfoToast, newSuccessToast } from "#/components/Toast";
import { usePermissions } from "#/providers/PermissionsProvider";
import { FormControlLabel, Checkbox } from "@mui/material";
import * as m from "#/paraglide/messages";
import { Container, Header, Title } from "#/components/pages/admin/AdminPage.styles";
import UserMention from "#/components/markdown/components/UserMention";
import { AdminHackathon } from "../AdminHackathonsPage";

type TracksIndexGetResponse = Awaited<ReturnType<ReturnType<typeof api.admin.hackathons>["tracks"]["get"]>>;
export type AdminTrack = NonNullable<TracksIndexGetResponse["data"]>["items"][number];

interface AdminTracksPageProps {
    hackathonId: string;
    hackathon?: AdminHackathon;
}

export function AdminTracksPage({ hackathonId, hackathon }: AdminTracksPageProps) {
    const router = useRouter();
    const { ability } = usePermissions();
    const [rows, setRows] = useState<AdminTrack[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [includeInactive, setIncludeInactive] = useState(false);

    const PAGE_SIZE = 50;
    const resourceBase = `admin.hackathons.${hackathonId}.tracks`;
    const canCreate = ability.can("create", resourceBase) && hackathon?.isActive !== false;
    const canManage = ability.can("manage", resourceBase);

    const load = useCallback(
        async (notify?: boolean) => {
            try {
                setLoading(true);
                const { data, error } = await api.admin.hackathons({ id: hackathonId }).tracks.get({
                    query: {
                        page,
                        pageSize: PAGE_SIZE,
                        search: search || undefined,
                        includeInactive: includeInactive && canManage
                    }
                });

                if (!error && data) {
                    setRows(data.items);
                    setTotal(data.total);
                    if (notify) {
                        newInfoToast(m["admin.hackathons.tracks.toasts.updated"]());
                    }
                } else {
                    throw new Error("Failed to load tracks");
                }
            } catch (e) {
                console.error("Failed to load tracks:", e);
                setRows([]);
                newErrorToast(m["admin.hackathons.tracks.toasts.error"]());
            } finally {
                setLoading(false);
            }
        },
        [hackathonId, page, search, includeInactive, canManage]
    );

    useEffect(() => {
        load();
    }, [load]);

    const handleDelete = async (trackId: string) => {
        try {
            const { error } = await api.admin.hackathons({ id: hackathonId }).tracks({ trackId }).delete();

            if (!error) {
                newSuccessToast(m["admin.hackathons.tracks.toasts.deleted"]());
                load();
            } else {
                throw new Error("Failed to delete track");
            }
        } catch (e) {
            console.error("Delete error:", e);
            newErrorToast(m["admin.hackathons.tracks.toasts.error"]());
        }
    };

    const handleRestore = async (trackId: string) => {
        try {
            const { error } = await api.admin.hackathons({ id: hackathonId }).tracks({ trackId }).patch({ isActive: true });

            if (!error) {
                newSuccessToast(m["admin.hackathons.tracks.toasts.updated"]());
                load();
            } else {
                throw new Error("Failed to restore track");
            }
        } catch (e) {
            console.error("Restore error:", e);
            newErrorToast(m["admin.hackathons.tracks.toasts.error"]());
        }
    };

    const columns = useMemo(
        () => [
            textColumn<AdminTrack>("name", m["admin.hackathons.tracks.fields.name"](), (r) => r.name, { bold: true, noTranslate: true }),
            customColumn<AdminTrack>("judges", m["admin.hackathons.tracks.fields.judges"](), (r) => (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }} data-no-ai-translate>
                    {r.judges.map((u: string, i: number) => {
                        const isId = /^[0-9a-fA-F]{24}$/.test(u);
                        return (
                            <span key={i}>
                                {isId ? <UserMention userId={u} isAdmin /> : u}
                                {i < r.judges.length - 1 && ", "}
                            </span>
                        );
                    })}
                </div>
            )),
            textColumn<AdminTrack>("rubric", m["admin.hackathons.tracks.sections.rubric"](), (r) => `${r.rubric.length} criteria`),
            chipColumn<AdminTrack, "active" | "deleted">(
                "status",
                "Status",
                (r) => (r.isActive ? "active" : "deleted"),
                (status) => status.charAt(0).toUpperCase() + status.slice(1),
                (status) => (status === "active" ? "success" : "error"),
                "filled"
            )
        ],
        []
    );

    return (
        <Container>
            <Header>
                <Title>{m["admin.hackathons.tracks.title"]()}</Title>
            </Header>

            <AdminTable
                columns={columns}
                data={rows}
                loading={loading}
                onReload={() => load(true)}
                reloadLabel={m["admin.hackathons.tracks.list.reload"]()}
                emptyMessage={m["admin.hackathons.tracks.list.noTracks"]()}
                noResultsMessage={m["admin.hackathons.tracks.list.noResults"]()}
                headerActions={
                    <>
                        <AddButton onClick={() => router.push(`/admin/hackathons/${hackathonId}/tracks/create`)} disabled={!canCreate}>
                            {m["admin.hackathons.tracks.actions.addTrack"]()}
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
                                label={m["admin.hackathons.tracks.list.showDeleted"]()}
                            />
                        )}
                    </>
                }
                rowActions={(row) => {
                    const hackathonInactive = hackathon?.isActive === false;
                    const canEditRow = row.isActive && !hackathonInactive && ability.canUpdateAnyField(`${resourceBase}.${row._id}`, row);

                    return (
                        <>
                            <LeaderboardButton
                                onClick={() => router.push(`/admin/hackathons/${hackathonId}/tracks/${row._id}/leaderboard`)}
                                ariaLabel="View leaderboard"
                                iconSize={20}
                                disabled={ability.cannot("read", `${resourceBase}.${row._id}`)}
                            />
                            {canEditRow ? (
                                <EditButton
                                    onClick={() => router.push(`/admin/hackathons/${hackathonId}/tracks/${row._id}`)}
                                    ariaLabel="Edit track"
                                    iconSize={20}
                                />
                            ) : (
                                <ViewButton
                                    onClick={() => router.push(`/admin/hackathons/${hackathonId}/tracks/${row._id}`)}
                                    ariaLabel="View track"
                                    iconSize={20}
                                    disabled={ability.cannot("read", `${resourceBase}.${row._id}`)}
                                />
                            )}
                            {!row.isActive ? (
                                <RestoreButton
                                    onClick={() => handleRestore(row._id)}
                                    ariaLabel="Restore track"
                                    iconSize={20}
                                    disabled={hackathonInactive || !canManage}
                                />
                            ) : (
                                <DeleteButton
                                    onClick={() => handleDelete(row._id)}
                                    ariaLabel="Delete track"
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
                    placeholder: m["admin.hackathons.tracks.list.search"]()
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
