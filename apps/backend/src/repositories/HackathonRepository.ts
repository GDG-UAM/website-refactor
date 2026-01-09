import { Collection, ObjectId, type Filter, type Sort } from "mongodb";
import type { Hackathon } from "./types";

export type HackathonInput = {
    title: string;
    date: Date | string;
    endDate?: Date | string | null;
    location?: string | null;
    intermission?: any;
    certificateDefaults?: any;
};

export type HackathonSortTypes = "newest" | "oldest" | "title_asc" | "title_desc";

export class HackathonRepository {
    constructor(private collection: Collection<Hackathon>) {}

    async create(input: HackathonInput, userId: string): Promise<Hackathon> {
        const now = new Date();
        const hackathon: Hackathon = {
            _id: new ObjectId(),
            ...input,
            date: new Date(input.date),
            endDate: input.endDate ? new Date(input.endDate) : undefined,
            isActive: true,
            createdBy: userId,
            createdAt: now,
            updatedAt: now
        } as Hackathon;

        await this.collection.insertOne(hackathon);
        return hackathon;
    }

    async update(id: string, input: Partial<HackathonInput>): Promise<Hackathon | null> {
        const updates: Record<string, unknown> = { ...input, updatedAt: new Date() };

        // Remove non-editable fields
        delete updates._id;
        delete updates.createdBy;
        delete updates.createdAt;

        if (input.date) updates.date = new Date(input.date);
        if (input.endDate !== undefined) {
            updates.endDate = input.endDate ? new Date(input.endDate) : null;
        }

        const result = await this.collection.findOneAndUpdate({ _id: new ObjectId(id) }, { $set: updates }, { returnDocument: "after" });

        return result;
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.collection.updateOne({ _id: new ObjectId(id) }, { $set: { isActive: false, updatedAt: new Date() } });
        return result.modifiedCount > 0;
    }

    async findById(id: string, options?: { includeInactive?: boolean }): Promise<Hackathon | null> {
        const query: Filter<Hackathon> = { _id: new ObjectId(id) };
        if (!options?.includeInactive) {
            query.isActive = true;
        }
        return await this.collection.findOne(query);
    }

    async findBySlug(slug: string, options?: { includeInactive?: boolean }): Promise<Hackathon | null> {
        const query: Filter<Hackathon> = { slug };
        if (!options?.includeInactive) {
            query.isActive = true;
        }
        return await this.collection.findOne(query);
    }

    async list(params: {
        search?: string;
        page?: number;
        pageSize?: number;
        sort?: HackathonSortTypes;
        includeInactive?: boolean;
    }): Promise<{ items: Hackathon[]; total: number; page: number; pageSize: number }> {
        const { search, page = 1, pageSize = 10, sort = "newest", includeInactive = false } = params;

        const filter: Filter<Hackathon> = {};
        if (!includeInactive) filter.isActive = true;

        if (search) {
            filter.title = { $regex: search, $options: "i" };
        }

        const sortMap: Record<HackathonSortTypes, Sort> = {
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
        await this.collection.createIndex({ date: -1 });
        await this.collection.createIndex({ title: 1 });
        await this.collection.createIndex({ isActive: 1 });
    }
}
