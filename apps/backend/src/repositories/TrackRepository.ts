import { Collection, ObjectId, type Filter } from "mongodb";
import type { Track } from "./types";

export type TrackInput = {
    hackathonId: string;
    name: string;
    judges: string[];
    rubric: {
        name: string;
        weight: number;
    }[];
};

export class TrackRepository {
    constructor(private collection: Collection<Track>) {}

    async create(input: TrackInput, userId: string): Promise<Track> {
        const now = new Date();
        const track: Track = {
            _id: new ObjectId(),
            hackathonId: new ObjectId(input.hackathonId),
            name: input.name,
            judges: input.judges,
            rubric: input.rubric,
            isActive: true,
            createdBy: userId,
            createdAt: now,
            updatedAt: now
        };

        await this.collection.insertOne(track);
        return track;
    }

    async update(id: string, input: Partial<Omit<TrackInput, "hackathonId">>): Promise<Track | null> {
        const updates: Record<string, unknown> = { ...input, updatedAt: new Date() };

        const result = await this.collection.findOneAndUpdate({ _id: new ObjectId(id) }, { $set: updates }, { returnDocument: "after" });

        return result;
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.collection.updateOne({ _id: new ObjectId(id) }, { $set: { isActive: false, updatedAt: new Date() } });
        return result.modifiedCount > 0;
    }

    async findById(id: string, options?: { includeInactive?: boolean }): Promise<Track | null> {
        const query: Filter<Track> = { _id: new ObjectId(id) };
        if (!options?.includeInactive) {
            query.isActive = true;
        }
        return await this.collection.findOne(query);
    }

    async listByHackathon(hackathonId: string, options?: { includeInactive?: boolean }): Promise<Track[]> {
        const query: Filter<Track> = { hackathonId: new ObjectId(hackathonId) };
        if (!options?.includeInactive) {
            query.isActive = true;
        }
        return await this.collection.find(query).toArray();
    }

    async list(params: {
        hackathonId: string;
        search?: string;
        page?: number;
        pageSize?: number;
        includeInactive?: boolean;
    }): Promise<{ items: Track[]; total: number; page: number; pageSize: number }> {
        const { hackathonId, search, page = 1, pageSize = 10, includeInactive = false } = params;

        const filter: Filter<Track> = { hackathonId: new ObjectId(hackathonId) };
        if (!includeInactive) filter.isActive = true;

        if (search) {
            filter.name = { $regex: search, $options: "i" };
        }

        const total = await this.collection.countDocuments(filter);
        const items = await this.collection
            .find(filter)
            .sort({ name: 1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .toArray();

        return { items, total, page, pageSize };
    }

    async createIndexes(): Promise<void> {
        await this.collection.createIndex({ hackathonId: 1 });
        await this.collection.createIndex({ name: 1 });
        await this.collection.createIndex({ isActive: 1 });
    }
}
