import { Collection, ObjectId } from "mongodb";
import type { PermissionTemplate } from "./types";

export class PermissionTemplateRepository {
    constructor(private collection: Collection<PermissionTemplate>) {}

    /**
     * Find template by ID
     */
    async findById(id: string): Promise<PermissionTemplate | null> {
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }

    /**
     * Find all active templates
     */
    async findAll(options?: { includeInactive?: boolean }): Promise<PermissionTemplate[]> {
        const query: Record<string, unknown> = {};

        if (!options?.includeInactive) {
            query.isActive = true;
        }

        return await this.collection.find(query).sort({ name: 1 }).toArray();
    }

    /**
     * Find template by name
     */
    async findByName(name: string): Promise<PermissionTemplate | null> {
        return await this.collection.findOne({ name });
    }

    /**
     * Create new template
     */
    async create(template: Omit<PermissionTemplate, "_id" | "createdAt" | "updatedAt">): Promise<PermissionTemplate> {
        // Validation: ensure grants and denies don't overlap
        const overlap = template.grants.filter((action) => template.denies.includes(action));
        if (overlap.length > 0) {
            throw new Error(`Actions cannot be both granted and denied: ${overlap.join(", ")}`);
        }

        const now = new Date();
        const newTemplate: PermissionTemplate = {
            ...template,
            usageCount: template.usageCount || 0,
            isActive: template.isActive ?? true,
            createdAt: now,
            updatedAt: now
        };

        const result = await this.collection.insertOne(newTemplate);
        newTemplate._id = result.insertedId;
        return newTemplate;
    }

    /**
     * Update template by ID
     */
    async updateById(id: string, updates: Partial<Omit<PermissionTemplate, "_id" | "createdAt" | "updatedAt">>): Promise<PermissionTemplate | null> {
        // If updating grants/denies, validate they don't overlap
        if (updates.grants || updates.denies) {
            const existing = await this.findById(id);
            if (!existing) {
                return null;
            }

            const finalGrants = updates.grants ?? existing.grants;
            const finalDenies = updates.denies ?? existing.denies;
            const overlap = finalGrants.filter((action) => finalDenies.includes(action));
            if (overlap.length > 0) {
                throw new Error(`Actions cannot be both granted and denied: ${overlap.join(", ")}`);
            }
        }

        const result = await this.collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { ...updates, updatedAt: new Date() } },
            { returnDocument: "after" }
        );

        return result;
    }

    /**
     * Delete (soft delete) template by ID
     */
    async deleteById(id: string): Promise<boolean> {
        const result = await this.collection.updateOne({ _id: new ObjectId(id) }, { $set: { isActive: false, updatedAt: new Date() } });

        return result.modifiedCount > 0;
    }

    /**
     * Increment usage count for a template
     */
    async incrementUsage(id: string): Promise<void> {
        await this.collection.updateOne({ _id: new ObjectId(id) }, { $inc: { usageCount: 1 } });
    }

    /**
     * Check if template name exists
     */
    async nameExists(name: string, excludeId?: string): Promise<boolean> {
        const query: Record<string, unknown> = { name };
        if (excludeId) {
            query._id = { $ne: new ObjectId(excludeId) };
        }
        const count = await this.collection.countDocuments(query);
        return count > 0;
    }

    /**
     * Create indexes for permission template collection
     */
    async createIndexes(): Promise<void> {
        // Unique index on name
        await this.collection.createIndex({ name: 1 }, { unique: true });

        // Single field indexes
        await this.collection.createIndex({ isActive: 1 });
    }
}
