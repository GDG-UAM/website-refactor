import ArticlePage from "#/components/pages/article/ArticlePage";
import { serverApi } from "#/lib/eden-server";
import { buildSectionMetadata } from "#/lib/metadata";
import { notFound } from "next/navigation";
import { cache } from "react";

const getArticleBySlug = cache(async (slug: string) => {
    const { data, error } = await serverApi.articles({ slug }).get({ query: { type: "blog" } });
    if (error) {
        return null;
    }
    return data;
});

function isValidSlug(slug: string) {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export async function generateMetadata(context: { params: Promise<{ slug: string }> }) {
    const { slug: raw } = await context.params;
    const slug = decodeURIComponent(raw).trim().toLowerCase();
    if (!isValidSlug(slug)) return buildSectionMetadata("blog");
    const article = await getArticleBySlug(slug);
    if (!article) return buildSectionMetadata("blog");
    const name = article.title;
    const description = (article.excerpt || article.content || "").slice(0, 160);
    return buildSectionMetadata("blog", name, description);
}

export default async function BlogPostPage(context: { params: Promise<{ slug: string }> }) {
    const { slug } = await context.params;
    const data = await getArticleBySlug(slug);

    if (!data) {
        notFound();
    }
    return <ArticlePage type="blog" article={data} />;
}
