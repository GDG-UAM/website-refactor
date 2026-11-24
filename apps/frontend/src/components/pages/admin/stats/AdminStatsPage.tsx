"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Checkbox, Chip, FormControlLabel, Switch, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { api } from "#/lib/eden";
import { newErrorToast } from "#/components/Toast";
import { usePermissions } from "#/providers/PermissionsProvider";
import * as m from "#/paraglide/messages";
import { Container, Header, Title } from "#/components/pages/admin/AdminPage.styles";
import * as S from "./AdminStatsPage.styles";

type Stats = NonNullable<Awaited<ReturnType<typeof api.admin.stats.get>>["data"]>;
type Kind = "article" | "link";
type Sort = "total" | "date";

interface Row {
    id: string;
    title: string;
    value: number;
    href?: string;
    date?: Date;
    excluded?: boolean;
    status?: string;
}

const fmt = (n: number) => Math.round(n).toLocaleString();
const sum = (rows: Row[]) => rows.reduce((acc, r) => acc + r.value, 0);

export function AdminStatsPage() {
    const { ability } = usePermissions();
    const canEdit = ability.can("update", "admin.stats");
    const [data, setData] = useState<Stats | null>(null);
    const [includeDrafts, setIncludeDrafts] = useState(false);
    const [sort, setSort] = useState<Sort>("total");

    useEffect(() => {
        api.admin.stats.get().then(({ data, error }) => (error || !data ? newErrorToast(m["admin.stats.loadError"]()) : setData(data)));
    }, []);

    const setExcluded = (kind: Kind, id: string, excluded: boolean) =>
        setData((d) =>
            !d
                ? d
                : kind === "article"
                  ? { ...d, articles: d.articles.map((a) => (a._id === id ? { ...a, excluded } : a)) }
                  : { ...d, links: d.links.map((l) => (l._id === id ? { ...l, excluded } : l)) }
        );

    const toggle = async (kind: Kind, id: string, excluded: boolean) => {
        setExcluded(kind, id, excluded);
        const { error } = await api.admin.stats({ kind })({ id }).patch({ excluded });
        if (error) {
            setExcluded(kind, id, !excluded);
            newErrorToast(m["admin.stats.updateError"]());
        }
    };

    const view = useMemo(() => {
        if (!data) return null;
        const articles = data.articles.filter((a) => includeDrafts || a.status !== "draft");
        const toRow = (a: Stats["articles"][number]): Row => ({
            id: a._id,
            title: a.title,
            value: a.views,
            href: `/admin/${a.type}/${a._id}`,
            date: new Date(a.date),
            excluded: a.excluded,
            status: a.status
        });
        const blog = articles.filter((a) => a.type === "blog").map(toRow);
        const newsletter = articles.filter((a) => a.type === "newsletter").map(toRow);
        const links: Row[] = data.links.map((l) => ({
            id: l._id,
            title: l.title,
            value: l.clicks,
            href: `/admin/links/${l._id}`,
            date: new Date(l.date),
            excluded: l.excluded
        }));

        const byAuthor = new Map<string, number>();
        for (const a of articles) if (!a.excluded) for (const name of a.authors) byAuthor.set(name, (byAuthor.get(name) ?? 0) + a.views);
        const authors: Row[] = [...byAuthor].map(([name, value]) => ({ id: name, title: name, value }));

        const counted = (rows: Row[]) => rows.filter((r) => !r.excluded);
        return { blog, newsletter, links, authors, counted };
    }, [data, includeDrafts]);

    if (!view) {
        return (
            <Container>
                <Header>
                    <Title>{m["admin.stats.title"]()}</Title>
                </Header>
                {data === null && <p>{m["loading.text"]()}</p>}
            </Container>
        );
    }

    const blog = view.counted(view.blog);
    const newsletter = view.counted(view.newsletter);
    const links = view.counted(view.links);
    const blogTotal = sum(blog);
    const newsletterTotal = sum(newsletter);
    const articleTotal = blogTotal + newsletterTotal;
    const summary = (rows: Row[]) => m["admin.stats.summary"]({ count: rows.length, average: fmt(rows.length ? sum(rows) / rows.length : 0) });

    return (
        <Container>
            <Header>
                <Title>{m["admin.stats.title"]()}</Title>
            </Header>

            <S.Controls>
                <FormControlLabel
                    control={<Switch checked={includeDrafts} onChange={(e) => setIncludeDrafts(e.target.checked)} />}
                    label={m["admin.stats.includeDrafts"]()}
                />
                <ToggleButtonGroup size="small" exclusive value={sort} onChange={(_, v) => v && setSort(v)} aria-label={m["admin.stats.sortBy"]()}>
                    <ToggleButton value="total">{m["admin.stats.sortTotal"]()}</ToggleButton>
                    <ToggleButton value="date">{m["admin.stats.sortDate"]()}</ToggleButton>
                </ToggleButtonGroup>
            </S.Controls>

            <S.Tiles>
                <StatTile label={m["admin.stats.articleReads"]()} value={articleTotal} sub={summary([...blog, ...newsletter])} />
                <StatTile label={m["admin.stats.blogReads"]()} value={blogTotal} sub={summary(blog)} />
                <StatTile label={m["admin.stats.newsletterReads"]()} value={newsletterTotal} sub={summary(newsletter)} />
                <StatTile label={m["admin.stats.linkClicks"]()} value={sum(links)} sub={summary(links)} />
            </S.Tiles>

            {articleTotal > 0 && (
                <S.Section>
                    <S.SectionTitle>{m["admin.stats.share"]()}</S.SectionTitle>
                    <S.ShareBar
                        role="img"
                        aria-label={`${m["admin.stats.blog"]()} ${fmt(blogTotal)}, ${m["admin.stats.newsletter"]()} ${fmt(newsletterTotal)}`}
                    >
                        <div style={{ flex: blogTotal, background: S.COLORS.blog }} />
                        <div style={{ flex: newsletterTotal, background: S.COLORS.newsletter }} />
                    </S.ShareBar>
                    <S.Legend>
                        {(
                            [
                                [m["admin.stats.blog"](), blogTotal, S.COLORS.blog],
                                [m["admin.stats.newsletter"](), newsletterTotal, S.COLORS.newsletter]
                            ] as const
                        ).map(([label, value, color]) => (
                            <span key={label}>
                                <S.Swatch $color={color} />
                                {label}: <strong>{fmt(value)}</strong> ({Math.round((value / articleTotal) * 100)}%)
                            </span>
                        ))}
                    </S.Legend>
                </S.Section>
            )}

            <BarList
                title={m["admin.stats.blog"]()}
                rows={view.blog}
                sort={sort}
                color={S.COLORS.blog}
                onToggle={canEdit ? (id, ex) => toggle("article", id, ex) : undefined}
            />
            <BarList
                title={m["admin.stats.newsletter"]()}
                rows={view.newsletter}
                sort={sort}
                color={S.COLORS.newsletter}
                onToggle={canEdit ? (id, ex) => toggle("article", id, ex) : undefined}
            />
            <BarList title={m["admin.stats.authors"]()} note={m["admin.stats.authorsNote"]()} rows={view.authors} sort="total" color={S.COLORS.authors} />
            <BarList
                title={m["admin.stats.links"]()}
                rows={view.links}
                sort={sort}
                color={S.COLORS.links}
                onToggle={canEdit ? (id, ex) => toggle("link", id, ex) : undefined}
            />
        </Container>
    );
}

function StatTile({ label, value, sub }: { label: string; value: number; sub: string }) {
    return (
        <S.Tile>
            <S.TileLabel>{label}</S.TileLabel>
            <S.TileValue>{fmt(value)}</S.TileValue>
            <S.TileSub>{sub}</S.TileSub>
        </S.Tile>
    );
}

function BarList({
    title,
    note,
    rows,
    sort,
    color,
    onToggle
}: {
    title: string;
    note?: string;
    rows: Row[];
    sort: Sort;
    color: string;
    onToggle?: (id: string, excluded: boolean) => void;
}) {
    const sorted = [...rows].sort((a, b) => (sort === "date" ? (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0) : b.value - a.value));
    const max = Math.max(1, ...rows.filter((r) => !r.excluded).map((r) => r.value));

    return (
        <S.Section>
            <S.SectionTitle>{title}</S.SectionTitle>
            {note && <S.Note>{note}</S.Note>}
            {sorted.length === 0 && <S.Note>{m["admin.stats.empty"]()}</S.Note>}
            <S.Rows>
                {sorted.map((r) => (
                    <S.Row key={r.id} $dim={!!r.excluded} title={`${r.title}: ${fmt(r.value)}`}>
                        {r.excluded === undefined ? (
                            <span />
                        ) : (
                            <Checkbox
                                size="small"
                                checked={!r.excluded}
                                disabled={!onToggle}
                                onChange={(e) => onToggle?.(r.id, !e.target.checked)}
                                slotProps={{ input: { "aria-label": `${m["admin.stats.countInStats"]()}: ${r.title}` } }}
                            />
                        )}
                        <S.RowTitle data-no-ai-translate>
                            {r.href ? <Link href={r.href}>{r.title}</Link> : <strong>{r.title}</strong>}
                            {(r.date || r.status !== "published") && (
                                <S.RowMeta>
                                    {r.date?.toLocaleDateString(undefined, { dateStyle: "medium" })}{" "}
                                    {r.status === "draft" && <Chip size="small" label={m["admin.stats.draft"]()} />}
                                    {r.status === "url_only" && <Chip size="small" label={m["admin.stats.urlOnly"]()} />}
                                    {r.excluded && <Chip size="small" label={m["admin.stats.excluded"]()} />}
                                </S.RowMeta>
                            )}
                        </S.RowTitle>
                        <S.Track aria-hidden>{!r.excluded && <S.Bar $color={color} style={{ width: `${(r.value / max) * 100}%` }} />}</S.Track>
                        <S.Value>{fmt(r.value)}</S.Value>
                    </S.Row>
                ))}
            </S.Rows>
        </S.Section>
    );
}
