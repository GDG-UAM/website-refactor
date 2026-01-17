import { Collection, ObjectId, Document } from "mongodb";
import type { User, SerializablePermission } from "./types";
import { updateUserSessions } from "../lib/auth";

// Role template name constants
const ROLE_TEMPLATE_PREFIX = "role:";
const ROLE_TEMPLATES: Record<string, string> = {
    team: `${ROLE_TEMPLATE_PREFIX}team`,
    organizer: `${ROLE_TEMPLATE_PREFIX}organizer`
};

export class UserRepository {
    constructor(
        private collection: Collection<User>,
        private templateCollection?: Collection<Document>,
        private permissionRepository?: { recomputeUserTemplatePermissions: (userId: string, userCollection: Collection<Document>) => Promise<void> }
    ) {}

    /**
     * Find user by ID
     */
    async findById(userId: string): Promise<User | null> {
        return await this.collection.findOne({ _id: new ObjectId(userId) });
    }

    /**
     * List users with pagination and search
     */
    async list({
        page = 1,
        pageSize = 50,
        search,
        roles
    }: {
        page?: number;
        pageSize?: number;
        search?: string;
        roles?: string[];
    }): Promise<{ items: User[]; total: number; page: number; pageSize: number }> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: any = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { displayName: { $regex: search, $options: "i" } }
            ];
        }

        if (roles) {
            query.role = { $in: roles };
        }

        const [items, total] = await Promise.all([
            this.collection
                .find(query)
                .sort({ name: 1 })
                .skip((page - 1) * pageSize)
                .limit(pageSize)
                .toArray(),
            this.collection.countDocuments(query)
        ]);

        return {
            items,
            total,
            page,
            pageSize
        };
    }

    /**
     * Find user by email
     */
    async findByEmail(email: string): Promise<User | null> {
        return await this.collection.findOne({ email });
    }

    /**
     * Update user role and automatically manage role templates
     */
    async updateRole(userId: string, role: string, oldRole?: string): Promise<User | null> {
        // Get current user to determine old role if not provided
        if (!oldRole) {
            const user = await this.findById(userId);
            oldRole = user?.role ?? undefined;
        }

        // Update the role
        const result = await this.collection.findOneAndUpdate(
            { _id: new ObjectId(userId) },
            { $set: { role, updatedAt: new Date() } },
            { returnDocument: "after" }
        );

        if (!result) {
            return null;
        }

        // Manage role templates if templateCollection is available
        if (this.templateCollection) {
            await this.syncRoleTemplates(userId, role, oldRole);
        }

        // Invalidate cached sessions for this user
        if (result) {
            await updateUserSessions(userId, result);
        } else {
            await updateUserSessions(userId);
        }

        return result;
    }

    /**
     * Sync role-based templates for a user
     * Adds template for new role, removes template from old role
     */
    private async syncRoleTemplates(userId: string, newRole: string, oldRole?: string): Promise<void> {
        if (!this.templateCollection) {
            return;
        }

        const user = await this.findById(userId);
        if (!user) {
            return;
        }

        let templatesUsed = user.templatesUsed || [];

        // Remove old role template if applicable
        if (oldRole && ROLE_TEMPLATES[oldRole]) {
            const oldTemplate = await this.templateCollection.findOne({ name: ROLE_TEMPLATES[oldRole] });
            if (oldTemplate) {
                const oldTemplateId = oldTemplate._id.toString();
                templatesUsed = templatesUsed.filter((id) => id !== oldTemplateId);
            }
        }

        // Add new role template if applicable
        if (ROLE_TEMPLATES[newRole]) {
            const newTemplate = await this.templateCollection.findOne({ name: ROLE_TEMPLATES[newRole] });
            if (newTemplate) {
                const newTemplateId = newTemplate._id.toString();
                if (!templatesUsed.includes(newTemplateId)) {
                    templatesUsed.push(newTemplateId);
                }
            }
        }

        // Update user's templates
        await this.updateTemplatesUsed(userId, templatesUsed);

        // Recompute template permissions
        if (this.permissionRepository) {
            await this.permissionRepository.recomputeUserTemplatePermissions(userId, this.collection as unknown as Collection<Document>);
        }
    }

    /**
     * Update individual permissions for a user
     */
    async updateIndividualPermissions(userId: string, permissions: SerializablePermission[]): Promise<void> {
        await this.collection.updateOne({ _id: new ObjectId(userId) }, { $set: { individualPermissions: permissions, updatedAt: new Date() } });
        // Invalidate cached sessions for this user
        await updateUserSessions(userId);
    }

    /**
     * Update template permissions for a user (computed from templates)
     */
    async updateTemplatePermissions(userId: string, permissions: SerializablePermission[]): Promise<void> {
        await this.collection.updateOne({ _id: new ObjectId(userId) }, { $set: { templatePermissions: permissions, updatedAt: new Date() } });
        // Invalidate cached sessions for this user
        await updateUserSessions(userId);
    }

    /**
     * Update templates used by a user
     */
    async updateTemplatesUsed(userId: string, templateIds: string[]): Promise<void> {
        await this.collection.updateOne({ _id: new ObjectId(userId) }, { $set: { templatesUsed: templateIds, updatedAt: new Date() } });
        // Invalidate cached sessions for this user
        await updateUserSessions(userId);
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

        if (result) {
            await updateUserSessions(userId, result);
        }

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

    async getTeam(): Promise<User[]> {
        return await this.collection.find({ role: { $in: ["team", "organizer"] } }).toArray();
    }

    /**
     * Update user with support for role, templates, and permissions changes
     */
    async update(userId: string, data: Partial<User>): Promise<User | null> {
        const { role, templatesUsed, individualPermissions, ...otherData } = data;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = { ...otherData, updatedAt: new Date() };
        if (role !== undefined) updateData.role = role;
        if (templatesUsed !== undefined) updateData.templatesUsed = templatesUsed;
        if (individualPermissions !== undefined) updateData.individualPermissions = individualPermissions;

        // Get current user to check role change
        const oldUser = await this.findById(userId);
        if (!oldUser) return null;

        const result = await this.collection.findOneAndUpdate({ _id: new ObjectId(userId) }, { $set: updateData }, { returnDocument: "after" });

        if (!result) return null;

        // Handle role synchronization if role changed
        if (role !== undefined && role !== null && role !== oldUser.role) {
            // syncRoleTemplates calls recomputeUserTemplatePermissions which updates the session cache
            await this.syncRoleTemplates(userId, role, oldUser.role || undefined);
        } else if (templatesUsed !== undefined || individualPermissions !== undefined) {
            // Recompute permissions if templates or individual permissions changed
            // recomputeUserTemplatePermissions will call updateUserSessions with fresh data from DB
            if (this.permissionRepository) {
                await this.permissionRepository.recomputeUserTemplatePermissions(userId, this.collection as unknown as Collection<Document>);
            } else {
                // If no permission repository, update sessions with fresh data from DB
                await updateUserSessions(userId);
            }
        }

        return result;
    }
}
