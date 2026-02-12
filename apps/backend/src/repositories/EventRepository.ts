import { Collection, ObjectId, type Filter, type Sort } from "mongodb";
import type { Event, EventStatus } from "./types";
import { toSlug } from "../lib/utils";
import { generateBlurHash } from "../lib/blurhash";
import { processMarkdownSave } from "../lib/markdownImages";

export type EventInput = {
    title: string;
    slug?: string;
    description?: string;
    date: Date;
    location?: string;
    image?: string | null;
    status?: EventStatus;
    url?: string;
    markdownContent: string;
    blogUrl?: string;
};

export type EventSortTypes = "newest" | "oldest" | "title_asc" | "title_desc";

export class EventRepository {
    constructor(private collection: Collection<Event>) {}

    async create(input: EventInput, userId: string): Promise<Event> {
        const slug = toSlug(input.slug || input.title);

        // Generate BlurHash if image is provided
        let imageBlurHash: string | undefined;
        let imageWidth: number | undefined;
        let imageHeight: number | undefined;

        if (input.image) {
            const blurResult = await generateBlurHash(input.image);
            if (blurResult) {
                imageBlurHash = blurResult.blurHash;
                imageWidth = blurResult.width;
                imageHeight = blurResult.height;
            }
        }

        // Process markdown content
        const processedMarkdown = await processMarkdownSave(input.markdownContent);

        const now = new Date();
        const event: Event = {
            _id: new ObjectId(),
            ...input,
            image: input.image || undefined,
            markdownContent: processedMarkdown,
            slug,
            imageBlurHash: imageBlurHash || undefined,
            imageWidth: imageWidth || undefined,
            imageHeight: imageHeight || undefined,
            status: input.status || "draft",
            isActive: true,
            createdBy: userId,
            createdAt: now,
            updatedAt: now
        };

        await this.collection.insertOne(event);
        return event;
    }

    async update(id: string, input: Partial<EventInput>): Promise<Event | null> {
        const updates: Record<string, unknown> = { ...input, updatedAt: new Date() };

        // Remove non-editable fields
        delete updates._id;
        delete updates.createdBy;
        delete updates.createdAt;

        if (input.slug) {
            updates.slug = toSlug(input.slug);
        }

        if (input.image !== undefined) {
            if (input.image) {
                const blurResult = await generateBlurHash(input.image);
                if (blurResult) {
                    updates.imageBlurHash = blurResult.blurHash;
                    updates.imageWidth = blurResult.width;
                    updates.imageHeight = blurResult.height;
                }
            } else {
                updates.imageBlurHash = undefined;
                updates.imageWidth = undefined;
                updates.imageHeight = undefined;
            }
        }

        if (input.markdownContent !== undefined) {
            updates.markdownContent = await processMarkdownSave(input.markdownContent);
        }

        const result = await this.collection.findOneAndUpdate({ _id: new ObjectId(id) }, { $set: updates }, { returnDocument: "after" });

        return result;
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.collection.updateOne({ _id: new ObjectId(id) }, { $set: { isActive: false, updatedAt: new Date() } });
        return result.modifiedCount > 0;
    }

    async findById(id: string, options?: { includeInactive?: boolean }): Promise<Event | null> {
        const query: Filter<Event> = { _id: new ObjectId(id) };
        if (!options?.includeInactive) {
            query.isActive = true;
        }
        return await this.collection.findOne(query);
    }

    async findByIdForEdit(id: string): Promise<Event | null> {
        const event = await this.findById(id, { includeInactive: true });
        if (!event) return null;

        const { processMarkdownForEdit } = await import("../lib/markdownImages");
        return {
            ...event,
            markdownContent: processMarkdownForEdit(event.markdownContent)
        };
    }

    async findBySlug(slug: string, options?: { includeInactive?: boolean }): Promise<Event | null> {
        const query: Filter<Event> = { slug };
        if (!options?.includeInactive) {
            query.isActive = true;
        }
        return await this.collection.findOne(query);
    }

    async list(params: {
        status?: EventStatus;
        dateStatus?: "past" | "upcoming";
        search?: string;
        page?: number;
        pageSize?: number;
        sort?: EventSortTypes;
        includeInactive?: boolean;
    }): Promise<{ items: Event[]; total: number; page: number; pageSize: number }> {
        const { status, dateStatus, search, page = 1, pageSize = 10, sort = "newest", includeInactive = false } = params;

        const filter: Filter<Event> = {};
        if (!includeInactive) filter.isActive = true;
        if (status) filter.status = status;

        if (search) {
            filter.$or = [{ title: { $regex: search, $options: "i" } }, { slug: { $regex: search, $options: "i" } }];
        }

        if (dateStatus) {
            const now = new Date();
            filter.date = dateStatus === "past" ? { $lt: now } : { $gte: now };
        }

        const sortMap: Record<EventSortTypes, Sort> = {
            newest: { date: -1 },
            oldest: { date: 1 },
            title_asc: { title: 1 },
            title_desc: { title: -1 }
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
        await this.collection.createIndex({ slug: 1, isActive: 1 }, { unique: true });
        await this.collection.createIndex({ status: 1, isActive: 1 });
        await this.collection.createIndex({ date: 1 });
        await this.collection.createIndex({ createdBy: 1 });
    }
}
