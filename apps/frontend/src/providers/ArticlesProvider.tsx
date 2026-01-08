"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import { api } from "#/lib/eden";

export type Article = NonNullable<Awaited<ReturnType<typeof api.articles.get>>["data"]>["items"][number];
export type FullArticle = NonNullable<Awaited<ReturnType<ReturnType<typeof api.articles>["get"]>>["data"]>;
export type ArticleType = Article["type"];

interface ArticleState {
    items: Article[];
    isLoading: boolean;
    error: Error | null;
    hasFetched: boolean;
}

interface ArticlesContextValue {
    blog: ArticleState;
    newsletter: ArticleState;
    fetchArticles: (type: ArticleType) => Promise<void>;
}

const ArticlesContext = createContext<ArticlesContextValue | undefined>(undefined);

export function ArticlesProvider({ children }: { children: ReactNode }) {
    const [blogState, setBlogState] = useState<ArticleState>({
        items: [],
        isLoading: false,
        error: null,
        hasFetched: false
    });

    const [newsletterState, setNewsletterState] = useState<ArticleState>({
        items: [],
        isLoading: false,
        error: null,
        hasFetched: false
    });

    const fetchArticles = useCallback(async (type: ArticleType) => {
        const setState = type === "blog" ? setBlogState : setNewsletterState;

        setState((prev) => {
            if (prev.isLoading) return prev;
            return { ...prev, isLoading: true, error: null };
        });

        try {
            const { data, error } = await api.articles.get({
                query: { type, pageSize: 100 }
            });

            if (error) throw error;

            if (data && "items" in data) {
                setState({
                    items: data.items as Article[],
                    isLoading: false,
                    error: null,
                    hasFetched: true
                });
            }
        } catch (err) {
            setState((prev) => ({ ...prev, isLoading: false, error: err as Error, hasFetched: true }));
        }
    }, []);

    const value = useMemo(
        () => ({
            blog: blogState,
            newsletter: newsletterState,
            fetchArticles
        }),
        [blogState, newsletterState, fetchArticles]
    );

    return <ArticlesContext.Provider value={value}>{children}</ArticlesContext.Provider>;
}

export function useBlogArticles() {
    const context = useContext(ArticlesContext);
    if (!context) throw new Error("useBlogArticles must be used within ArticlesProvider");

    const { blog, fetchArticles } = context;

    useEffect(() => {
        if (!blog.hasFetched && !blog.isLoading && !blog.error) {
            fetchArticles("blog");
        }
    }, [blog.hasFetched, blog.isLoading, blog.error, fetchArticles]);

    return blog;
}

export function useNewsletterArticles() {
    const context = useContext(ArticlesContext);
    if (!context) throw new Error("useNewsletterArticles must be used within ArticlesProvider");

    const { newsletter, fetchArticles } = context;

    useEffect(() => {
        if (!newsletter.hasFetched && !newsletter.isLoading && !newsletter.error) {
            fetchArticles("newsletter");
        }
    }, [newsletter.hasFetched, newsletter.isLoading, newsletter.error, fetchArticles]);

    return newsletter;
}

export function useArticles(type: ArticleType) {
    if (type === "blog") return useBlogArticles();
    if (type === "newsletter") return useNewsletterArticles();
    throw new Error("Invalid article type");
}
