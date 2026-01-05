import { Collection, ObjectId } from "mongodb";
import type { User, SerializablePermission } from "./types";

export class UserRepository {
    constructor(private collection: Collection<User>) {}

    /**
     * Find user by ID
     */
    async findById(userId: string): Promise<User | null> {
        return await this.collection.findOne({ _id: new ObjectId(userId) });
    }

    /**
     * Find user by email
     */
    async findByEmail(email: string): Promise<User | null> {
        return await this.collection.findOne({ email });
    }

    /**
     * Update user role
     */
    async updateRole(userId: string, role: string): Promise<User | null> {
        const result = await this.collection.findOneAndUpdate(
            { _id: new ObjectId(userId) },
            { $set: { role, updatedAt: new Date() } },
            { returnDocument: "after" }
        );
        return result;
    }

    /**
     * Sync permissions to user document (for Better Auth session)
     */
    async syncPermissions(userId: string, permissions: SerializablePermission[]): Promise<void> {
        await this.collection.updateOne({ _id: new ObjectId(userId) }, { $set: { permissions, updatedAt: new Date() } });
    }

    /**
     * Update user settings (flat field updates)
     */
    async updateSettings(userId: string, updates: Record<string, unknown>): Promise<User | null> {
        const result = await this.collection.findOneAndUpdate(
            { _id: new ObjectId(userId) },
            { $set: { ...updates, updatedAt: new Date() } },
            { returnDocument: "after" }
        );
        return result;
    }

    /**
     * Check if user exists
     */
    async exists(userId: string): Promise<boolean> {
        const count = await this.collection.countDocuments({ _id: new ObjectId(userId) });
        return count > 0;
    }

    /**
     * Create indexes for user collection
     */
    async createIndexes(): Promise<void> {
        await this.collection.createIndex({ email: 1 }, { unique: true });
        await this.collection.createIndex({ role: 1 });
    }
}
