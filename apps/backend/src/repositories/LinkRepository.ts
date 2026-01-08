import { Collection, ObjectId, type Filter, type Sort } from "mongodb";
import type { Link } from "./types";
import { toSlug } from "../lib/utils";

export type LinkInput = {
    slug: string;
    destination: string;
    title: string;
    description?: string;
    isActive?: boolean;
    order?: number;
};

export class LinkRepository {
    constructor(private collection: Collection<Link>) {}

    async create(input: LinkInput, userId: string): Promise<Link> {
        const slug = toSlug(input.slug);
        const now = new Date();

        const link: Link = {
            _id: new ObjectId(),
            ...input,
            slug,
            isActive: input.isActive ?? true,
            clicks: 0,
            createdBy: userId,
            createdAt: now,
            updatedAt: now
        };

        await this.collection.insertOne(link);
        return link;
    }

    async update(id: string, input: Partial<LinkInput>): Promise<Link | null> {
        const updates: Record<string, unknown> = { ...input, updatedAt: new Date() };

        // Remove non-editable fields
        delete updates._id;
        delete updates.createdBy;
        delete updates.createdAt;
        delete updates.clicks;

        if (input.slug) {
            updates.slug = toSlug(input.slug);
        }

        const result = await this.collection.findOneAndUpdate({ _id: new ObjectId(id) }, { $set: updates }, { returnDocument: "after" });

        return result;
    }

    async delete(id: string): Promise<boolean> {
        // Soft delete logic is usually better, but here we can follow the pattern of other repos
        const result = await this.collection.updateOne({ _id: new ObjectId(id) }, { $set: { isActive: false, updatedAt: new Date() } });
        return result.modifiedCount > 0;
    }

    async findById(id: string, options?: { includeInactive?: boolean }): Promise<Link | null> {
        const query: Filter<Link> = { _id: new ObjectId(id) };
        if (!options?.includeInactive) {
            query.isActive = true;
        }

        return await this.collection.findOne(query);
    }

    async findBySlug(slug: string): Promise<Link | null> {
        // Public lookup: only active links
        return await this.collection.findOne({ slug, isActive: true });
    }

    async incrementClicks(id: string): Promise<void> {
        await this.collection.updateOne({ _id: new ObjectId(id) }, { $inc: { clicks: 1 } });
    }

    async list(params: {
        search?: string;
        page?: number;
        pageSize?: number;
        includeInactive?: boolean;
    }): Promise<{ items: Link[]; total: number; page: number; pageSize: number }> {
        const { search, page = 1, pageSize = 50, includeInactive = false } = params;

        const filter: Filter<Link> = {};

        if (!includeInactive) {
            filter.isActive = true;
        }

        if (search) {
            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const regex = new RegExp(escaped, "i");

            filter.$or = [{ slug: regex }, { title: regex }, { description: regex }];
        }

        const sort: Sort = { order: 1, createdAt: -1 };

        const total = await this.collection.countDocuments(filter);
        const items = await this.collection
            .find(filter)
            .sort(sort)
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .toArray();

        return { items, total, page, pageSize };
    }

    async createIndexes(): Promise<void> {
        await this.collection.createIndex({ slug: 1 }, { unique: true });
        await this.collection.createIndex({ isActive: 1 });
        await this.collection.createIndex({ order: 1 });
        await this.collection.createIndex({ createdBy: 1 });
    }
}
