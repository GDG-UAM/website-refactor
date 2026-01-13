import { Collection, ObjectId, type Filter, type Sort } from "mongodb";
import { type Team, type TeamSchema } from "./types";
import { generatePassword } from "../lib/utils";

export type TeamInput = {
    name: string;
    hackathonId: string;
    trackId?: string | null;
    projectDescription?: string | null;
    users?: string[];
    isActive?: boolean;
};

export type TeamSortTypes = "newest" | "oldest" | "name_asc" | "name_desc";

export class TeamRepository {
    constructor(private collection: Collection<Team>) {}

    async create(input: TeamInput, userId: string): Promise<Team> {
        const now = new Date();

        const team: Team = {
            _id: new ObjectId(),
            name: input.name,
            hackathonId: new ObjectId(input.hackathonId),
            trackId: input.trackId ? new ObjectId(input.trackId) : null,
            password: generatePassword(), // Auto-generated
            projectDescription: input.projectDescription || null,
            users: input.users || [],
            isActive: input.isActive ?? true,
            createdBy: userId,
            createdAt: now,
            updatedAt: now
        };

        await this.collection.insertOne(team);
        return team;
    }

    async update(id: string, input: Partial<Omit<TeamInput, "password">>): Promise<Team | null> {
        const updates: Record<string, unknown> = { ...input, updatedAt: new Date() };

        // Convert string IDs to ObjectIds
        if (input.hackathonId) updates.hackathonId = new ObjectId(input.hackathonId);
        if (input.trackId !== undefined) updates.trackId = input.trackId ? new ObjectId(input.trackId) : null;

        // Remove non-editable fields if they somehow got in
        delete updates._id;
        delete (updates as any).password;
        delete (updates as any).createdBy;
        delete (updates as any).createdAt;

        const result = await this.collection.findOneAndUpdate({ _id: new ObjectId(id) }, { $set: updates }, { returnDocument: "after" });

        return result;
    }

    async reloadPassword(id: string): Promise<Team | null> {
        const newPassword = generatePassword();
        const result = await this.collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { password: newPassword, updatedAt: new Date() } },
            { returnDocument: "after" }
        );
        return result;
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.collection.updateOne({ _id: new ObjectId(id) }, { $set: { isActive: false, updatedAt: new Date() } });
        return result.modifiedCount > 0;
    }

    async findById(id: string, options?: { includeInactive?: boolean }): Promise<Team | null> {
        const query: Filter<Team> = { _id: new ObjectId(id) };
        if (!options?.includeInactive) {
            query.isActive = true;
        }
        return await this.collection.findOne(query);
    }

    async list(params: {
        hackathonId?: string;
        trackId?: string;
        search?: string;
        page?: number;
        pageSize?: number;
        sort?: TeamSortTypes;
        includeInactive?: boolean;
    }): Promise<{ items: Team[]; total: number; page: number; pageSize: number }> {
        const { hackathonId, trackId, search, page = 1, pageSize = 10, sort = "newest", includeInactive = false } = params;

        const filter: Filter<Team> = {};
        if (!includeInactive) filter.isActive = true;
        if (hackathonId) filter.hackathonId = new ObjectId(hackathonId);
        if (trackId) filter.trackId = new ObjectId(trackId);

        if (search) {
            filter.name = { $regex: search, $options: "i" };
        }

        const sortMap: Record<TeamSortTypes, Sort> = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            name_asc: { name: 1 },
            name_desc: { name: -1 }
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
        await this.collection.createIndex({ hackathonId: 1 });
        await this.collection.createIndex({ trackId: 1 });
        await this.collection.createIndex({ name: 1 });
        await this.collection.createIndex({ isActive: 1 });
        // Password should be unique within a hackathon?
        // MongoDB doesn't easily support cross-field unique constraints (unique: [hackathonId, password]) but we can do a compound unique index.
        await this.collection.createIndex({ hackathonId: 1, password: 1 }, { unique: true });
    }
}
