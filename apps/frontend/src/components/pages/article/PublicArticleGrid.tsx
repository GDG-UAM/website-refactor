"use client";

import { api } from "#/lib/eden";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { ArticleCard } from "./ArticleCard";
import { GridViewButton, ListViewButton, SearchButton } from "#/components/Buttons";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import { Article, ArticleType, useArticles } from "#/providers/ArticlesProvider";
import { PageWrapper, HeaderGrid, Title, Controls, Grid, ListContainer } from "./PublicArticleGrid.styles";
import { m } from "#/paraglide/messages";
import { motion, AnimatePresence } from "framer-motion";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
} as const;

export default function PublicArticleGrid({ type }: { type: ArticleType }) {
    const fetchOnType = true;

    const { items: providerArticles, isLoading: providerLoading, error: providerError } = useArticles(type);
    const [searchResults, setSearchResults] = useState<Article[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchCache = useRef<Record<string, Article[]>>({});

    const [view, setView] = useState<"grid" | "list">("grid");
    const [viewLoaded, setViewLoaded] = useState(false);
    const [query, setQuery] = useState<string>("");
    const debounceRef = useRef<number | null>(null);

    const searchButtonId = `article-search-btn-${type}`;

    const loadArticles = useCallback(
        async (q?: string) => {
            const trimmedQuery = q?.trim();
            if (!trimmedQuery) {
                setSearchResults([]);
                return;
            }

            const cacheKey = `${type}:${trimmedQuery}`;
            if (searchCache.current[cacheKey]) {
                setSearchResults(searchCache.current[cacheKey]);
                return;
            }

            setIsSearching(true);
            try {
                const { data } = await api.articles.get({
                    query: {
                        type,
                        q: trimmedQuery
                    }
                });

                if (data && "items" in data) {
                    const items = data.items;
                    searchCache.current[cacheKey] = items;
                    setSearchResults(items);
                }
            } catch (err) {
                console.error("Failed to load articles:", err);
            } finally {
                setIsSearching(false);
            }
        },
        [type]
    );

    const articles = useMemo(() => {
        if (!query.trim()) return providerArticles;
        if (searchResults.length > 0) return searchResults;
        if (isSearching) return providerArticles;
        return searchResults;
    }, [query, providerArticles, searchResults, isSearching]);

    const isLoading = query.trim() ? isSearching : providerLoading;
    const error = query.trim() ? null : providerError;

    useEffect(() => {
        try {
            const otherType = type === "blog" ? "newsletter" : "blog";
            const currentView = localStorage.getItem(`view.${type}`);
            const otherView = localStorage.getItem(`view.${otherType}`);
            if (currentView === "grid" || currentView === "list") setView(currentView);
            else if (otherView === "grid" || otherView === "list") setView(otherView);
            else setView("grid");
        } catch {
            setView("grid");
        } finally {
            setViewLoaded(true);
        }
    }, [type]);

    const saveView = (v: "grid" | "list") => {
        try {
            localStorage.setItem(`view.${type}`, v);
        } catch {}
        setView(v);
    };

    // debounced search when fetchOnType is enabled
    useEffect(() => {
        if (!fetchOnType) return;
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => {
            loadArticles(query || undefined);
        }, 500);
        return () => {
            if (debounceRef.current) window.clearTimeout(debounceRef.current);
        };
    }, [query, fetchOnType, loadArticles]);

    const sorted = useMemo(() => {
        // Newest first if dates exist
        return [...articles].sort((a, b) => {
            const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
            const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
            return db - da;
        });
    }, [articles]);

    return (
        <PageWrapper data-view={viewLoaded ? view : undefined}>
            <HeaderGrid>
                <Title>{m[`${type}.title`]()}</Title>

                <div style={{ width: "100%", maxWidth: 400, margin: "0 auto" }}>
                    <TextField
                        fullWidth
                        placeholder={m[`${type}.searchArticles`]()}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                // prevent default form submission
                                e.preventDefault();
                                // if fetchOnType is disabled, simulate a click on the search button
                                try {
                                    const btn = typeof document !== "undefined" ? document.getElementById(searchButtonId) : null;
                                    if (btn && !fetchOnType) {
                                        // trigger native click to allow the SearchButton to run its own animation/logic
                                        btn.click();
                                    } else if (!fetchOnType) {
                                        // fallback: call loadArticles directly
                                        loadArticles(query || undefined);
                                    }
                                } catch {
                                    if (!fetchOnType) loadArticles(query || undefined);
                                }
                            }
                        }}
                        size="small"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <SearchButton
                                        id={searchButtonId}
                                        onClick={() => loadArticles(query || undefined)}
                                        iconSize={16}
                                        style={{ marginRight: -10 }}
                                        showSpinner
                                        isLoading={isSearching}
                                    />
                                </InputAdornment>
                            )
                        }}
                    />
                </div>

                <Controls>
                    <GridViewButton onClick={() => saveView("grid")} disabled={view === "grid"} iconSize={20} />
                    <ListViewButton onClick={() => saveView("list")} disabled={view === "list"} iconSize={20} />
                </Controls>
            </HeaderGrid>

            {/* Preserve previous articles while loading; only show skeletons when we have none and are not searching */}
            <AnimatePresence mode="popLayout">
                {isLoading &&
                    !query.trim() &&
                    viewLoaded &&
                    articles.length === 0 &&
                    (view === "grid" ? (
                        <Grid as={motion.div} key="grid-skeleton" initial="hidden" animate="visible" variants={containerVariants}>
                            {Array.from({ length: 6 }).map((_, i) => (
                                <ArticleCard key={`skeleton-${i}`} skeleton />
                            ))}
                        </Grid>
                    ) : (
                        <ListContainer as={motion.div} key="list-skeleton" initial="hidden" animate="visible" variants={containerVariants}>
                            {Array.from({ length: 3 }).map((_, i) => (
                                <ArticleCard key={`skeleton-${i}`} skeleton />
                            ))}
                        </ListContainer>
                    ))}
            </AnimatePresence>

            {/* {error && <p style={{ color: "var(--google-error-red)" }}>Error: {error}</p>} */}
            {error && <p>{m[`${type}.noArticlesToShow`]()}</p>}

            {!isLoading && !error && sorted.length === 0 && <p>{m[`${type}.noArticlesToShow`]()}</p>}

            {(!isLoading || query.trim()) && !error && viewLoaded && (
                <AnimatePresence mode="popLayout">
                    {view === "grid" ? (
                        <Grid
                            as={motion.div}
                            key={`grid-${type}-${query}`}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.05 }}
                            variants={containerVariants}
                        >
                            {sorted.map((article) => (
                                <ArticleCard key={article.slug} article={article} type={type} />
                            ))}
                        </Grid>
                    ) : (
                        <ListContainer
                            as={motion.div}
                            key={`list-${type}-${query}`}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.05 }}
                            variants={containerVariants}
                        >
                            {sorted.map((article) => (
                                <ArticleCard key={article.slug} article={article} type={type} />
                            ))}
                        </ListContainer>
                    )}
                </AnimatePresence>
            )}
        </PageWrapper>
    );
}
