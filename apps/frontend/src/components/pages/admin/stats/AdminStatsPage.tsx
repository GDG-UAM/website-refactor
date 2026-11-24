"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Checkbox, FormControlLabel, MenuItem, TextField } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { api } from "#/lib/eden";
import { getLocale } from "#/paraglide/runtime";
import * as m from "#/paraglide/messages";
import { AdminNavigationButton, EditButton, OpenLinkButton } from "#/components/Buttons";
import { AdminTable } from "#/components/pages/admin/AdminTable";
import { chipColumn, customColumn, dateColumn, textColumn } from "#/components/pages/admin/AdminTableFactories";
import { LoadingSpinner } from "#/components/pages/admin/AdminTable.styles";
import { Container, Header, Title } from "#/components/pages/admin/AdminPage.styles";
import { newErrorToast, newInfoToast } from "#/components/Toast";
import { usePermissions } from "#/providers/PermissionsProvider";
import * as S from "./AdminStatsPage.styles";

type Stats = NonNullable<Awaited<ReturnType<typeof api.admin.stats.get>>["data"]>;
type Section = "blog" | "newsletter" | "links";
type Order = "date" | "value";
type Status = Stats["articles"][number]["status"];

interface Item {
    _id: string;
    title: string;
    slug: string;
    value: number;
    date: Date;
    excluded: boolean;
    status?: Status;
    editHref: string;
    publicHref: string;
}

const SECTIONS: Section[] = ["blog", "newsletter", "links"];
// One colour per section (only one chart is ever on screen); validated against the white surface
const COLORS: Record<Section, string> = { blog: "#1a73e8", newsletter: "#e37400", links: "#188038" };
const PAGE_SIZE = 10;

const sum = (items: Item[]) => items.reduce((acc, i) => acc + i.value, 0);
const fmt = (n: number) => Math.round(n).toLocaleString(getLocale());
const fmtDate = (d: Date) => d.toLocaleDateString(getLocale(), { day: "numeric", month: "short", year: "numeric" });

function median(values: number[]) {
    if (!values.length) return 0;
    const s = [...values].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function AdminStatsPage() {
    const router = useRouter();
    const { ability } = usePermissions();
    const canEdit = ability.can("update", "admin.stats");
    const initialSection = useSearchParams().get("section") as Section | null;

    const [data, setData] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [section, setSection] = useState<Section>(initialSection && SECTIONS.includes(initialSection) ? initialSection : "blog");
    const [includeDrafts, setIncludeDrafts] = useState(false);
    const [order, setOrder] = useState<Order>("date");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const load = useCallback(async (notify?: boolean) => {
        setLoading(true);
        const { data, error } = await api.admin.stats.get();
        if (error || !data) newErrorToast(m["admin.stats.loadError"]());
        else {
            setData(data);
            if (notify) newInfoToast(m["admin.stats.reload"]());
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    // All items of every section, drafts filtered out unless asked for
    const bySection = useMemo(() => {
        const result: Record<Section, Item[]> = { blog: [], newsletter: [], links: [] };
        if (!data) return result;
        for (const a of data.articles) {
            if (a.status === "draft" && !includeDrafts) continue;
            result[a.type].push({
                _id: a._id,
                title: a.title,
                slug: a.slug,
                value: a.views,
                date: new Date(a.date),
                excluded: a.excluded,
                status: a.status,
                editHref: `/admin/${a.type}/${a._id}`,
                publicHref: `/${a.type}/${a.slug}`
            });
        }
        result.links = data.links.map((l) => ({
            _id: l._id,
            title: l.title,
            slug: l.slug,
            value: l.clicks,
            date: new Date(l.date),
            excluded: l.excluded,
            editHref: `/admin/links/${l._id}`,
            publicHref: l.destination
        }));
        return result;
    }, [data, includeDrafts]);

    const items = bySection[section];
    const counted = items.filter((i) => !i.excluded);
    const total = sum(counted);
    const isLinks = section === "links";
    const kind = isLinks ? "link" : "article";
    const unit = isLinks ? m["admin.stats.clicksUnit"]() : m["admin.stats.readsUnit"]();

    const allOfSection = data ? (isLinks ? data.links.length : data.articles.filter((a) => a.type === section).length) : 0;
    const hiddenDrafts = data && !isLinks && !includeDrafts ? data.articles.filter((a) => a.type === section && a.status === "draft").length : 0;
    const articleTotal = sum(bySection.blog.filter((i) => !i.excluded)) + sum(bySection.newsletter.filter((i) => !i.excluded));
    const top = counted.reduce<Item | null>((best, i) => (!best || i.value > best.value ? i : best), null);

    const byDate = (a: Item, b: Item) => a.date.getTime() - b.date.getTime();
    const chartItems = [...counted].sort(order === "date" ? byDate : (a, b) => b.value - a.value);
    const chartLabels = new Map(chartItems.map((i) => [i._id, `${i.title} (${fmtDate(i.date)})`]));

    const query = search.trim().toLowerCase();
    const tableItems = items
        .filter((i) => !query || i.title.toLowerCase().includes(query) || i.slug.includes(query))
        .sort(order === "date" ? (a, b) => byDate(b, a) : (a, b) => b.value - a.value);

    const setExcluded = (id: string, excluded: boolean) =>
        setData((d) =>
            !d
                ? d
                : isLinks
                  ? { ...d, links: d.links.map((l) => (l._id === id ? { ...l, excluded } : l)) }
                  : { ...d, articles: d.articles.map((a) => (a._id === id ? { ...a, excluded } : a)) }
        );

    const toggle = async (id: string, excluded: boolean) => {
        setExcluded(id, excluded);
        const { error } = await api.admin.stats({ kind })({ id }).patch({ excluded });
        if (error) {
            setExcluded(id, !excluded);
            newErrorToast(m["admin.stats.updateError"]());
        }
    };

    const selectSection = (s: Section) => {
        setSection(s);
        // In the URL so coming back from an edit page lands on the same section
        window.history.replaceState(null, "", `?section=${s}`);
        setSearch("");
        setPage(1);
    };

    const columns = [
        customColumn<Item>(
            "counted",
            m["admin.stats.columns.counted"](),
            (i) => (
                <Checkbox
                    size="small"
                    checked={!i.excluded}
                    disabled={!canEdit}
                    onChange={(e) => toggle(i._id, !e.target.checked)}
                    slotProps={{ input: { "aria-label": `${m["admin.stats.countInStats"]()}: ${i.title}` } }}
                />
            ),
            { width: "1px" }
        ),
        textColumn<Item>("title", m["admin.stats.columns.title"](), (i) => i.title, {
            bold: true,
            subValue: (i) => <S.Slug>/{i.slug}</S.Slug>,
            noTranslate: true
        }),
        ...(isLinks
            ? []
            : [
                  chipColumn<Item, Status>(
                      "status",
                      m["admin.stats.columns.status"](),
                      (i) => i.status!,
                      (s) => m[`admin.stats.status.${s}`](),
                      (s) => (s === "published" ? "success" : s === "draft" ? "warning" : "info")
                  )
              ]),
        dateColumn<Item>("date", isLinks ? m["admin.stats.columns.created"]() : m["admin.stats.columns.published"](), (i) => i.date),
        customColumn<Item>("value", isLinks ? m["admin.stats.clicks"]() : m["admin.stats.reads"](), (i) => <S.Num>{fmt(i.value)}</S.Num>, {
            align: "right"
        }),
        customColumn<Item>(
            "share",
            m["admin.stats.columns.share"](),
            (i) => <S.Num $muted>{i.excluded || !total ? "—" : `${((i.value / total) * 100).toFixed(1)}%`}</S.Num>,
            { align: "right" }
        )
    ];

    return (
        <Container>
            <Header>
                <Title>{m["admin.stats.title"]()}</Title>
            </Header>

            <S.Toolbar>
                <S.Tabs>
                    {SECTIONS.map((s) => (
                        <AdminNavigationButton key={s} type={s} color={s === section ? "primary" : "default"} onClick={() => selectSection(s)}>
                            {m[`admin.navigation.${s}`]()}
                        </AdminNavigationButton>
                    ))}
                </S.Tabs>
                <S.ToolbarEnd>
                    {!isLinks && (
                        <FormControlLabel
                            control={<Checkbox checked={includeDrafts} onChange={(e) => setIncludeDrafts(e.target.checked)} />}
                            label={m["admin.stats.includeDrafts"]()}
                        />
                    )}
                    <TextField
                        select
                        size="small"
                        label={m["admin.stats.order"]()}
                        value={order}
                        onChange={(e) => setOrder(e.target.value as Order)}
                        style={{ minWidth: 150 }}
                    >
                        <MenuItem value="date">{m["admin.stats.orderDate"]()}</MenuItem>
                        <MenuItem value="value">{isLinks ? m["admin.stats.orderClicks"]() : m["admin.stats.orderReads"]()}</MenuItem>
                    </TextField>
                </S.ToolbarEnd>
            </S.Toolbar>

            <S.Overview>
                {!data ? (
                    <S.Empty>{loading ? <LoadingSpinner /> : m["admin.stats.loadError"]()}</S.Empty>
                ) : (
                    <>
                        <S.Kpis>
                            <S.Kpi>
                                <dt>{isLinks ? m["admin.stats.clicks"]() : m["admin.stats.reads"]()}</dt>
                                <S.KpiValue>{fmt(total)}</S.KpiValue>
                                {!isLinks && articleTotal > 0 && (
                                    <S.KpiSub>{m["admin.stats.shareOfArticles"]({ percent: Math.round((total / articleTotal) * 100) })}</S.KpiSub>
                                )}
                            </S.Kpi>
                            <S.Kpi>
                                <dt>
                                    {isLinks
                                        ? m["admin.stats.linksCounted"]()
                                        : section === "blog"
                                          ? m["admin.stats.postsCounted"]()
                                          : m["admin.stats.issuesCounted"]()}
                                </dt>
                                <S.KpiValue>{fmt(counted.length)}</S.KpiValue>
                                <S.KpiSub>
                                    {m["admin.stats.ofTotal"]({ total: fmt(allOfSection) })}
                                    {hiddenDrafts > 0 && <>. {m["admin.stats.draftsHidden"]({ count: hiddenDrafts })}</>}
                                </S.KpiSub>
                            </S.Kpi>
                            <S.Kpi>
                                <dt>{m["admin.stats.average"]()}</dt>
                                <S.KpiValue>{fmt(counted.length ? total / counted.length : 0)}</S.KpiValue>
                                <S.KpiSub>{m["admin.stats.median"]({ value: fmt(median(counted.map((i) => i.value))) })}</S.KpiSub>
                            </S.Kpi>
                            <S.Kpi>
                                <dt>{isLinks ? m["admin.stats.mostClicked"]() : m["admin.stats.mostRead"]()}</dt>
                                <S.KpiTitle title={top?.title} data-no-ai-translate>
                                    {top?.title ?? "—"}
                                </S.KpiTitle>
                                {top && (
                                    <S.KpiSub>
                                        {fmt(top.value)} {unit}
                                    </S.KpiSub>
                                )}
                            </S.Kpi>
                        </S.Kpis>

                        <S.ChartArea>
                            <S.ChartHeader>
                                <S.ChartTitle>
                                    {isLinks
                                        ? m["admin.stats.clicksPerLink"]()
                                        : section === "blog"
                                          ? m["admin.stats.readsPerPost"]()
                                          : m["admin.stats.readsPerIssue"]()}
                                </S.ChartTitle>
                                <S.ChartHint>{m["admin.stats.chartHint"]()}</S.ChartHint>
                            </S.ChartHeader>
                            {chartItems.length === 0 ? (
                                <S.Empty>{m["admin.stats.empty"]()}</S.Empty>
                            ) : (
                                <BarChart
                                    height={260}
                                    hideLegend
                                    borderRadius={4}
                                    grid={{ horizontal: true }}
                                    margin={{ top: 8, right: 8, bottom: 4, left: 0 }}
                                    series={[
                                        {
                                            data: chartItems.map((i) => i.value),
                                            color: COLORS[section],
                                            label: isLinks ? m["admin.stats.clicks"]() : m["admin.stats.reads"](),
                                            valueFormatter: (v) => fmt(v ?? 0)
                                        }
                                    ]}
                                    xAxis={[
                                        {
                                            scaleType: "band",
                                            data: chartItems.map((i) => i._id),
                                            position: "none",
                                            // Thin bars when there are few, so they don't turn into blocks
                                            categoryGapRatio: chartItems.length <= 20 ? 0.6 : chartItems.length <= 50 ? 0.35 : 0.2,
                                            valueFormatter: (id: string) => chartLabels.get(id) ?? ""
                                        }
                                    ]}
                                    yAxis={[
                                        {
                                            width: 44,
                                            disableLine: true,
                                            disableTicks: true,
                                            valueFormatter: (v: number) => v.toLocaleString(getLocale(), { notation: "compact" })
                                        }
                                    ]}
                                    onItemClick={(_, { dataIndex }) => router.push(chartItems[dataIndex].editHref)}
                                />
                            )}
                        </S.ChartArea>
                    </>
                )}
            </S.Overview>

            <AdminTable
                columns={columns}
                data={tableItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
                loading={loading}
                onReload={() => load(true)}
                reloadLabel={m["admin.stats.reload"]()}
                rowActions={(i) => (
                    <>
                        <OpenLinkButton href={i.publicHref} ariaLabel={m["admin.stats.open"]()} iconSize={20} />
                        <EditButton onClick={() => router.push(i.editHref)} ariaLabel={m["admin.stats.edit"]()} iconSize={20} />
                    </>
                )}
                search={{
                    value: search,
                    onChange: (v) => {
                        setSearch(v);
                        setPage(1);
                    },
                    placeholder: m["admin.stats.search"]()
                }}
                pagination={{ page, pageSize: PAGE_SIZE, total: tableItems.length, onPageChange: setPage }}
                emptyMessage={m["admin.stats.empty"]()}
                noResultsMessage={m["admin.stats.noResults"]()}
            />
        </Container>
    );
}
