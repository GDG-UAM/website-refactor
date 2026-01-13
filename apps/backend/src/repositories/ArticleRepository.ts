import { Collection, ObjectId, type Filter, type Sort } from "mongodb";
import type { Article, ArticleType, ArticleStatus } from "./types";
import { toSlug } from "../lib/utils";
import { generateBlurHash } from "../lib/blurhash";
import { processMarkdownSave } from "../lib/markdownImages";

export type ArticleInput = {
    type: ArticleType;
    title: Record<string, string>;
    slug?: string;
    excerpt?: Record<string, string>;
    content: Record<string, string>;
    coverImage?: string;
    status: ArticleStatus;
    authors: string[];
    publishedAt?: Date | null;
};

export type ArticleSortTypes = "newest" | "oldest" | "views";

export class ArticleRepository {
    constructor(private collection: Collection<Article>) {}

    async create(input: ArticleInput, userId: string): Promise<Article> {
        const title = input.title || {};
        const sourceTitle = title["es"] || title["en"] || Object.values(title)[0] || "untitled";
        const slug = toSlug(input.slug || sourceTitle);

        // Generate BlurHash if coverImage is provided
        let coverImageBlurHash: string | undefined;
        let coverImageWidth: number | undefined;
        let coverImageHeight: number | undefined;

        if (input.coverImage) {
            const blurResult = await generateBlurHash(input.coverImage);
            if (blurResult) {
                coverImageBlurHash = blurResult.blurHash;
                coverImageWidth = blurResult.width;
                coverImageHeight = blurResult.height;
            }
        }

        // Process markdown content for each locale
        const processedContent: Record<string, string> = {};
        for (const [locale, text] of Object.entries(input.content || {})) {
            processedContent[locale] = await processMarkdownSave(text);
        }

        const now = new Date();
        const article: Article = {
            _id: new ObjectId(),
            ...input,
            content: processedContent,
            slug,
            coverImageBlurHash,
            coverImageWidth,
            coverImageHeight,
            views: 0,
            isActive: true,
            createdBy: userId,
            createdAt: now,
            updatedAt: now
        };

        if (input.status === "published" && !input.publishedAt) {
            article.publishedAt = now;
        }

        await this.collection.insertOne(article);
        return article;
    }

    async update(id: string, input: Partial<ArticleInput>): Promise<Article | null> {
        const updates: Record<string, unknown> = { ...input, updatedAt: new Date() };

        // Remove non-editable fields
        delete updates._id;
        delete updates.createdBy;
        delete updates.createdAt;
        delete updates.views;

        if (input.slug) {
            updates.slug = toSlug(input.slug);
        }

        if (input.coverImage !== undefined) {
            if (input.coverImage) {
                const blurResult = await generateBlurHash(input.coverImage);
                if (blurResult) {
                    updates.coverImageBlurHash = blurResult.blurHash;
                    updates.coverImageWidth = blurResult.width;
                    updates.coverImageHeight = blurResult.height;
                }
            } else {
                updates.coverImageBlurHash = null;
                updates.coverImageWidth = null;
                updates.coverImageHeight = null;
            }
        }

        if (input.content) {
            const processedContent: Record<string, string> = {};
            for (const [locale, text] of Object.entries(input.content)) {
                processedContent[locale] = await processMarkdownSave(text);
            }
            updates.content = processedContent;
        }

        const result = await this.collection.findOneAndUpdate({ _id: new ObjectId(id) }, { $set: updates }, { returnDocument: "after" });

        return result;
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.collection.updateOne({ _id: new ObjectId(id) }, { $set: { isActive: false, updatedAt: new Date() } });
        return result.modifiedCount > 0;
    }

    async findById(id: string, options?: { includeInactive?: boolean; incrementView?: boolean }): Promise<Article | null> {
        const query: Filter<Article> = { _id: new ObjectId(id) };
        if (!options?.includeInactive) {
            query.isActive = true;
        }

        if (options?.incrementView) {
            const result = await this.collection.findOneAndUpdate(query, { $inc: { views: 1 } }, { returnDocument: "after" });
            return result;
        }

        return await this.collection.findOne(query);
    }

    async findByIdForEdit(id: string): Promise<Article | null> {
        const article = await this.findById(id, { includeInactive: true });
        if (!article) return null;

        // Convert markdown back to edit format
        const editContent: Record<string, string> = {};
        for (const [locale, text] of Object.entries(article.content)) {
            const { processMarkdownForEdit } = await import("../lib/markdownImages");
            editContent[locale] = processMarkdownForEdit(text);
        }

        return {
            ...article,
            content: editContent
        };
    }

    async findBySlug(slug: string, type?: ArticleType | null, options?: { includeInactive?: boolean; incrementView?: boolean }): Promise<Article | null> {
        const query: Filter<Article> = { slug };
        if (type) query.type = type;
        if (!options?.includeInactive) {
            query.isActive = true;
        }

        if (options?.incrementView) {
            const result = await this.collection.findOneAndUpdate(query, { $inc: { views: 1 } }, { returnDocument: "after" });
            return result;
        }

        return await this.collection.findOne(query);
    }

    async list(params: {
        type?: ArticleType;
        status?: ArticleStatus;
        search?: string;
        page?: number;
        pageSize?: number;
        sort?: ArticleSortTypes;
        includeInactive?: boolean;
    }): Promise<{ items: Article[]; total: number; page: number; pageSize: number }> {
        const { type, status, search, page = 1, pageSize = 10, sort = "newest", includeInactive = false } = params;

        const filter: Filter<Article> = {};
        if (!includeInactive) filter.isActive = true;
        if (type) filter.type = type;
        if (status) filter.status = status;

        if (search) {
            // Text search across title, excerpt, content locales
            // Note: MongoDB Atlas Search would be better, but for pure MongoDB we use regex on values
            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const regex = new RegExp(escaped, "i");

            filter.$or = [
                { "title.es": regex },
                { "title.en": regex },
                { "excerpt.es": regex },
                { "excerpt.en": regex },
                { "content.es": regex },
                { "content.en": regex }
            ];
        }

        const sortMap: Record<ArticleSortTypes, Sort> = {
            newest: { publishedAt: -1, createdAt: -1 },
            oldest: { publishedAt: 1, createdAt: 1 },
            views: { views: -1 }
        };

        const total = await this.collection.countDocuments(filter);
        const items = await this.collection
            .find(filter)
            .sort(sortMap[sort])
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .toArray();

        return { items, total, page, pageSize };
    }

    async createIndexes(): Promise<void> {
        await this.collection.createIndex({ slug: 1, type: 1, isActive: 1 }, { unique: true });
        await this.collection.createIndex({ status: 1, isActive: 1 });
        await this.collection.createIndex({ type: 1, isActive: 1 });
        await this.collection.createIndex({ createdBy: 1 });
        await this.collection.createIndex({ publishedAt: -1 });
    }
}
