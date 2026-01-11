"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "#/lib/eden";
import { AdminTable } from "#/components/pages/admin/AdminTable";
import { textColumn, chipColumn, customColumn, dateColumn } from "#/components/pages/admin/AdminTableFactories";
import { AddButton, EditButton, DeleteButton, RestoreButton, ViewButton } from "#/components/Buttons";
import { newErrorToast, newInfoToast, newSuccessToast } from "#/components/Toast";
import { usePermissions } from "#/providers/PermissionsProvider";
import { FormControlLabel, Checkbox } from "@mui/material";
import * as m from "#/paraglide/messages";
import { getLocale } from "#/paraglide/runtime";
import { Container, Header, Title } from "#/components/pages/admin/AdminPage.styles";
import UserMention from "#/components/markdown/components/UserMention";

export type AdminArticle = NonNullable<Awaited<ReturnType<typeof api.admin.articles.get>>["data"]>["items"][number];

interface AdminArticlesPageProps {
    type: "blog" | "newsletter";
}

export function AdminArticlesPage({ type }: AdminArticlesPageProps) {
    const router = useRouter();
    const { ability } = usePermissions();
    const locale = getLocale();
    const [rows, setRows] = useState<AdminArticle[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [includeInactive, setIncludeInactive] = useState(false);

    // Types derived from API
    type ArticleQuery = NonNullable<NonNullable<Parameters<typeof api.admin.articles.get>[0]>["query"]>;
    type ArticleStatus = NonNullable<ArticleQuery["status"]>;
    type ArticleSort = NonNullable<ArticleQuery["sort"]>;

    // Filters
    const [statusFilter, setStatusFilter] = useState<ArticleStatus | "all">("all");
    const [sortFilter, setSortFilter] = useState<ArticleSort>("newest");

    const PAGE_SIZE = 50;

    const canCreate = ability.can("create", `admin.articles.${type}`);
    const canManage = ability.can("manage", `admin.articles.${type}`);

    const load = useCallback(
        async (notify?: boolean) => {
            try {
                setLoading(true);
                const { data, error } = await api.admin.articles.get({
                    query: {
                        type,
                        status: statusFilter === "all" ? undefined : statusFilter,
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
                        newInfoToast(m["admin.articles.list.toasts.reloaded"]());
                    }
                } else {
                    throw new Error("Failed to load articles");
                }
            } catch (e) {
                console.error("Failed to load articles:", e);
                setRows([]);
                newErrorToast(m["admin.articles.list.toasts.loadError"]());
            } finally {
                setLoading(false);
            }
        },
        [type, statusFilter, sortFilter, page, search, includeInactive]
    );

    useEffect(() => {
        load();
    }, [load]);

    const handleDelete = async (id: string) => {
        try {
            const { error } = await api.admin.articles({ id }).delete();

            if (!error) {
                newSuccessToast(m["admin.articles.list.toasts.deleteSuccess"]());
                load();
            } else {
                throw new Error("Failed to delete article");
            }
        } catch (e) {
            console.error("Delete error:", e);
            newErrorToast(e instanceof Error ? e.message : m["admin.articles.list.toasts.deleteError"]());
        }
    };

    const handleRestore = async (id: string) => {
        try {
            const { error } = await api.admin.articles({ id }).patch({ isActive: true });

            if (!error) {
                newSuccessToast(m["admin.articles.list.toasts.restoreSuccess"]());
                load();
            } else {
                throw new Error("Failed to restore article");
            }
        } catch (e) {
            console.error("Restore error:", e);
            newErrorToast(e instanceof Error ? e.message : m["admin.articles.list.toasts.restoreError"]());
        }
    };

    const columns = useMemo(
        () => [
            textColumn<AdminArticle>(
                "title",
                m["admin.articles.form.title"](),
                (r) => r.title[locale] || r.title["en"] || Object.values(r.title)[0] || "No title",
                {
                    bold: true,
                    subValue: (r) => r.slug
                }
            ),
            ...(type === "blog"
                ? [
                      customColumn<AdminArticle>("authors", m["blog.authors"](), (r) => (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                              {r.authors.map((u: string, i: number) => {
                                  const isId = /^[0-9a-fA-F]{24}$/.test(u);
                                  return (
                                      <span key={i}>
                                          {isId ? <UserMention userId={u} isAdmin /> : u}
                                          {i < r.authors.length - 1 && ", "}
                                      </span>
                                  );
                              })}
                          </div>
                      ))
                  ]
                : []),
            textColumn<AdminArticle>("views", m["admin.articles.list.columns.views"](), (r) => r.views.toString()),
            dateColumn<AdminArticle>("date", m["admin.articles.form.date"](), (r) => r.publishedAt),
            chipColumn<AdminArticle, "published" | "draft" | "url_only" | "deleted">(
                "status",
                m["admin.articles.list.columns.status"](),
                (r) => (r.isActive ? r.status : "deleted"),
                (status) => m[`admin.articles.status.${status}`](),
                (status) => (status === "published" ? "success" : status === "deleted" ? "error" : status === "url_only" ? "secondary" : "warning"),
                "filled"
            )
        ],
        [locale, type]
    );

    const statusOptions = [
        { label: m["admin.articles.list.all"](), value: "all" },
        { label: m["admin.articles.status.draft"](), value: "draft" },
        { label: m["admin.articles.status.published"](), value: "published" }
    ];
    if (type === "blog") {
        statusOptions.push({ label: m["admin.articles.status.url_only"](), value: "url_only" });
    }
    const filters = [
        {
            key: "status",
            label: m["admin.articles.list.columns.status"](),
            value: statusFilter,
            onChange: (val: string) => {
                setStatusFilter(val as ArticleStatus | "all");
                setPage(1);
            },
            options: statusOptions
        },
        {
            key: "sort",
            label: m["admin.articles.list.sort"](),
            value: sortFilter,
            onChange: (val: string) => {
                setSortFilter(val as ArticleSort);
                setPage(1);
            },
            options: [
                { label: m["admin.articles.list.sort_newest"](), value: "newest" },
                { label: m["admin.articles.list.sort_oldest"](), value: "oldest" },
                { label: m["admin.articles.list.sort_views"](), value: "views" }
            ]
        }
    ];

    const pageTitle = type === "blog" ? m["admin.articles.blog.listTitle"]() : m["admin.articles.newsletter.listTitle"]();
    const createBtnLabel = type === "blog" ? m["admin.articles.blog.create"]() : m["admin.articles.newsletter.create"]();

    return (
        <Container>
            <Header>
                <Title>{pageTitle}</Title>
            </Header>

            <AdminTable
                columns={columns}
                data={rows}
                loading={loading}
                onReload={() => load(true)}
                reloadLabel={m["admin.articles.list.reload"]()}
                filters={filters}
                headerActions={
                    <>
                        <AddButton onClick={() => router.push(`/admin/${type}/create`)} disabled={!canCreate}>
                            {createBtnLabel}
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
                                label={m["admin.articles.list.showDeleted"]()}
                            />
                        )}
                    </>
                }
                rowActions={(row) => (
                    <>
                        {row.isActive && ability.canUpdateAnyField(`admin.articles.${type}.${row._id}`, row) ? (
                            <EditButton onClick={() => router.push(`/admin/${type}/${row._id}`)} ariaLabel="Edit article" iconSize={20} />
                        ) : (
                            <ViewButton
                                onClick={() => router.push(`/admin/${type}/${row._id}`)}
                                ariaLabel="View article"
                                iconSize={20}
                                disabled={ability.cannot("read", `admin.articles.${type}.${row._id}`)}
                            />
                        )}
                        {canManage && !row.isActive ? (
                            <RestoreButton onClick={() => handleRestore(row._id)} ariaLabel="Restore article" iconSize={20} />
                        ) : (
                            <DeleteButton
                                onClick={() => handleDelete(row._id)}
                                ariaLabel="Delete article"
                                iconSize={20}
                                disabled={!row.isActive || ability.cannot("delete", `admin.articles.${type}.${row._id}`)}
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
                    placeholder: m["admin.articles.list.search"]()
                }}
                emptyMessage={m["admin.articles.list.noArticles"]()}
                noResultsMessage={m["admin.articles.list.noResults"]()}
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
