import { Collection, ObjectId } from "mongodb";
import type { PermissionTemplate } from "./types";
import { invalidateUserSessions } from "../lib/auth";

export class PermissionRepository {
    constructor(private collection: Collection<PermissionTemplate>) {}

    /**
     * Maps legacy permission templates structure to the new granular permissions format
     */
    private mapLegacyTemplate(template: any): PermissionTemplate {
        if (template.permissions && Array.isArray(template.permissions)) {
            return template as PermissionTemplate;
        }

        const permissions: any[] = [];

        // Map grants
        if (template.grants && Array.isArray(template.grants) && template.grants.length > 0) {
            permissions.push({
                resource: template.pattern || "*",
                actions: template.grants,
                effect: "allow"
            });
        }

        // Map denies
        if (template.denies && Array.isArray(template.denies) && template.denies.length > 0) {
            permissions.push({
                resource: template.pattern || "*",
                actions: template.denies,
                effect: "deny"
            });
        }

        const mapped = {
            ...template,
            permissions
        };

        // Clean up legacy fields to avoid validation errors if strictly typed
        delete mapped.pattern;
        delete mapped.grants;
        delete mapped.denies;
        delete mapped.usageCount;

        return mapped as PermissionTemplate;
    }

    /**
     * Find template by ID
     */
    async findTemplateById(id: string): Promise<PermissionTemplate | null> {
        const template = await this.collection.findOne({ _id: new ObjectId(id) });
        return template ? this.mapLegacyTemplate(template) : null;
    }

    /**
     * Find all active templates
     */
    async findTemplates(options?: { includeInactive?: boolean }): Promise<PermissionTemplate[]> {
        const query: Record<string, unknown> = {};

        if (!options?.includeInactive) {
            query.isActive = true;
        }

        const templates = await this.collection.find(query).sort({ name: 1 }).toArray();
        return templates.map((t) => this.mapLegacyTemplate(t));
    }

    /**
     * Find template by name
     */
    async findTemplateByName(name: string): Promise<PermissionTemplate | null> {
        const template = await this.collection.findOne({ name });
        return template ? this.mapLegacyTemplate(template) : null;
    }

    /**
     * Create new template
     */
    async createTemplate(template: Omit<PermissionTemplate, "_id" | "createdAt" | "updatedAt">): Promise<PermissionTemplate> {
        const now = new Date();
        const newTemplate: PermissionTemplate = {
            ...template,
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
     * Automatically updates all users who have this template
     */
    async updateTemplateById(
        id: string,
        updates: Partial<Omit<PermissionTemplate, "_id" | "createdAt" | "updatedAt">>,
        userCollection?: Collection
    ): Promise<PermissionTemplate | null> {
        const result = await this.collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { ...updates, updatedAt: new Date() } },
            { returnDocument: "after" }
        );

        if (!result) return null;

        // Update all users who have this template
        if (userCollection) {
            await this.updateUsersWithTemplate(id, userCollection);
        }

        return this.mapLegacyTemplate(result);
    }

    /**
     * Delete (soft delete) template by ID
     * Automatically removes template from all users and recomputes their permissions
     */
    async deleteTemplateById(id: string, userCollection?: Collection): Promise<boolean> {
        const result = await this.collection.updateOne({ _id: new ObjectId(id) }, { $set: { isActive: false, updatedAt: new Date() } });

        // Remove template from all users
        if (result.modifiedCount > 0 && userCollection) {
            await this.removeTemplateFromUsers(id, userCollection);
        }

        return result.modifiedCount > 0;
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

    /**
     * Compute template permissions for a user based on their templatesUsed
     * Returns deduplicated permissions (no repeated entries)
     */
    async computeTemplatePermissions(
        templateIds: string[],
        _userCollection: Collection
    ): Promise<
        Array<{
            resource: string;
            actions: string[];
            effect: "allow" | "deny";
            conditions?: Record<string, unknown>;
        }>
    > {
        if (!templateIds || templateIds.length === 0) {
            return [];
        }

        // Fetch all templates
        const templates = await this.collection
            .find({
                _id: { $in: templateIds.map((id) => new ObjectId(id)) },
                isActive: true
            })
            .toArray();

        // Collect all permissions from templates
        const permissions: Array<{
            resource: string;
            actions: string[];
            effect: "allow" | "deny";
            conditions?: Record<string, unknown>;
        }> = [];

        for (const rawTemplate of templates) {
            const template = this.mapLegacyTemplate(rawTemplate);
            if (template.permissions && Array.isArray(template.permissions)) {
                permissions.push(...template.permissions);
            }
        }

        // Deduplicate permissions by creating a unique key
        const seen = new Set<string>();
        const deduplicated = permissions.filter((perm) => {
            const key = `${perm.resource}:${perm.effect}:${perm.actions.sort().join(",")}:${JSON.stringify(perm.conditions || {})}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });

        return deduplicated;
    }

    /**
     * Recompute and update template permissions for a specific user
     */
    async recomputeUserTemplatePermissions(userId: string, userCollection: Collection): Promise<void> {
        // Get user's template IDs
        const user = await userCollection.findOne({ _id: new ObjectId(userId) });
        if (!user) {
            return;
        }

        const templateIds = user.templatesUsed || [];
        const templatePermissions = await this.computeTemplatePermissions(templateIds, userCollection);

        // Update user document
        await userCollection.updateOne({ _id: new ObjectId(userId) }, { $set: { templatePermissions, updatedAt: new Date() } });

        // Invalidate cached sessions for this user
        invalidateUserSessions(userId);
    }

    /**
     * Update all users who have a specific template in their templatesUsed
     */
    async updateUsersWithTemplate(templateId: string, userCollection: Collection): Promise<void> {
        // Find all users with this template
        const users = await userCollection.find({ templatesUsed: templateId }).toArray();

        // Recompute permissions for each user
        for (const user of users) {
            await this.recomputeUserTemplatePermissions(user._id.toString(), userCollection);
        }
    }

    /**
     * Remove template from all users and recompute their permissions
     */
    async removeTemplateFromUsers(templateId: string, userCollection: Collection): Promise<void> {
        // Remove template from all users' templatesUsed arrays
        await userCollection.updateMany(
            { templatesUsed: templateId },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { $pull: { templatesUsed: templateId } as unknown as any, $set: { updatedAt: new Date() } }
        );

        // Find all users who had this template
        const users = await userCollection.find({ templatesUsed: { $exists: true } }).toArray();

        // Recompute permissions for each affected user
        for (const user of users) {
            await this.recomputeUserTemplatePermissions(user._id.toString(), userCollection);
        }
    }
}
