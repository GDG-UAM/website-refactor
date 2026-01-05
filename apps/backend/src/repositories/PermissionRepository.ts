import { Collection, ObjectId } from "mongodb";
import { LRUCache } from "lru-cache";
import type { Permission, PermissionTemplate, SerializablePermission } from "./types";
import type { Actions, AppAbility, ApplyTemplateInput, PermissionCheckResult } from "@gdg-uam/permissions";
import { parsePattern, matchesPattern, expandPattern, evaluateConditions, hashResourcePath, AbilityBuilder } from "@gdg-uam/permissions";

// Forward declarations to avoid circular dependency
interface IPermissionTemplateRepository {
    findById(id: string): Promise<PermissionTemplate | null>;
    incrementUsage(id: string): Promise<void>;
}

interface IUserRepository {
    syncPermissions(userId: string, permissions: SerializablePermission[]): Promise<void>;
}

// Cache for permission lookups (5 minute TTL)
const permissionCache = new LRUCache<string, Permission[]>({
    max: 1000,
    ttl: 1000 * 60 * 5 // 5 minutes
});

// Cache for built abilities
const abilityCache = new LRUCache<string, AppAbility>({
    max: 500,
    ttl: 1000 * 60 * 5 // 5 minutes
});

export class PermissionRepository {
    constructor(
        private collection: Collection<Permission>,
        private templateRepository: IPermissionTemplateRepository,
        private userRepository: IUserRepository
    ) {}

    /**
     * Get all active permissions for a user (for session storage)
     * Returns a lightweight serializable format
     */
    async getUserPermissions(userId: string): Promise<SerializablePermission[]> {
        const permissions = await this.collection
            .find({
                userId,
                isActive: true,
                $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }]
            })
            .sort({ priority: -1 })
            .toArray();

        // Return serializable format without MongoDB-specific fields
        return permissions.map((perm) => ({
            resource: perm.resource,
            actions: perm.actions,
            effect: perm.effect,
            conditions: perm.conditions,
            priority: perm.priority
        }));
    }

    /**
     * Find permissions matching a resource path for a user
     */
    async findMatchingPermissions(userId: string, resourcePath: string, action?: Actions): Promise<Permission[]> {
        // Try cache first
        const cacheKey = `${userId}:${hashResourcePath(resourcePath)}:${action || "all"}`;
        const cached = permissionCache.get(cacheKey);
        if (cached) {
            return cached;
        }

        // Query database
        const parts = resourcePath.split(".");
        const query: Record<string, unknown> = {
            userId,
            isActive: true,
            pathDepth: { $lte: parts.length },
            "resourcePath.0": parts[0],
            $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }]
        };

        if (action) {
            query.$or = [{ actions: action }, { actions: "manage" }];
        }

        const permissions = await this.collection.find(query).sort({ priority: -1, pathDepth: -1 }).toArray();

        // Filter matches in-memory using pattern matching
        const matches = permissions.filter((perm: Permission) => {
            const parsed = parsePattern(perm.resource);
            return matchesPattern(parsed.segments, parts);
        });

        // Cache the result
        permissionCache.set(cacheKey, matches);

        return matches;
    }

    /**
     * Build an ability from pre-loaded permissions (from session)
     */
    buildAbilityFromPermissions(permissions: SerializablePermission[], context: Record<string, unknown> = {}): AppAbility {
        const builder = new AbilityBuilder();

        // Sort by priority (deny rules have higher priority)
        const sorted = [...permissions].sort((a, b) => b.priority - a.priority);

        // Convert permissions to rules
        for (const perm of sorted) {
            const conditions = evaluateConditions(perm.conditions, context);
            const method = perm.effect === "deny" ? builder.cannot.bind(builder) : builder.can.bind(builder);

            // Add rule for each action
            for (const action of perm.actions) {
                method(action, perm.resource, conditions);
            }
        }

        return builder.build();
    }

    /**
     * Build an ability from user permissions (legacy method, queries DB)
     */
    async buildAbility(userId: string, context: Record<string, unknown> = {}): Promise<AppAbility> {
        const resourcePath = (context.resourcePath as string) || "*";
        const cacheKey = `ability:${userId}:${hashResourcePath(resourcePath)}`;

        // Try cache first
        const cached = abilityCache.get(cacheKey);
        if (cached) {
            return cached;
        }

        // Get matching permissions from database
        const permissions = await this.findMatchingPermissions(userId, resourcePath as string);

        // Build ability
        const builder = new AbilityBuilder();

        // Sort by priority (deny rules have higher priority)
        permissions.sort((a, b) => b.priority - a.priority);

        // Convert permissions to rules
        for (const perm of permissions) {
            const conditions = evaluateConditions(perm.conditions, context);
            const method = perm.effect === "deny" ? builder.cannot.bind(builder) : builder.can.bind(builder);

            // Add rule for each action
            for (const action of perm.actions) {
                method(action, perm.resource, conditions);
            }
        }

        const ability = builder.build();

        // Cache the built ability
        abilityCache.set(cacheKey, ability);

        return ability;
    }

    /**
     * Apply a permission template to a user
     */
    async applyTemplate(input: ApplyTemplateInput): Promise<Permission[]> {
        const { userId, templateId, bindings, conditions, expiresAt, grantedBy, reason } = input;

        // Load template
        const template = await this.templateRepository.findById(templateId);
        if (!template || !template.isActive) {
            throw new Error(`Template not found or inactive: ${templateId}`);
        }

        // Expand pattern with bindings
        const expandedResource = expandPattern(template.pattern, bindings);

        // Create permission documents
        const permissions: Permission[] = [];
        const now = new Date();

        // Create allow permissions for grants
        if (template.grants.length > 0) {
            const resource = expandedResource;
            const resourcePath = resource.split(".");
            const allowPerm: Permission = {
                userId,
                templateId,
                resource,
                resourcePath,
                pathDepth: resourcePath.length,
                actions: template.grants,
                effect: "allow",
                priority: 50,
                conditions: { ...template.conditions, ...conditions },
                expiresAt,
                grantedBy,
                reason: reason || `Applied template: ${template.name}`,
                isActive: true,
                createdAt: now,
                updatedAt: now
            };
            const result = await this.collection.insertOne(allowPerm);
            allowPerm._id = result.insertedId;
            permissions.push(allowPerm);
        }

        // Create deny permissions for denies
        if (template.denies.length > 0) {
            const resource = expandedResource;
            const resourcePath = resource.split(".");
            const denyPerm: Permission = {
                userId,
                templateId,
                resource,
                resourcePath,
                pathDepth: resourcePath.length,
                actions: template.denies,
                effect: "deny",
                priority: 100,
                conditions: { ...template.conditions, ...conditions },
                expiresAt,
                grantedBy,
                reason: reason || `Applied template (deny): ${template.name}`,
                isActive: true,
                createdAt: now,
                updatedAt: now
            };
            const result = await this.collection.insertOne(denyPerm);
            denyPerm._id = result.insertedId;
            permissions.push(denyPerm);
        }

        // Increment template usage count
        await this.templateRepository.incrementUsage(templateId);

        // Clear cache for this user
        this.clearUserCache(userId);

        // Sync permissions to user document
        await this.syncPermissionsToUser(userId);

        return permissions;
    }

    /**
     * Check if user has permission for a specific action
     */
    async checkPermission(
        userId: string,
        action: Actions,
        resourcePath: string,
        _context: Record<string, unknown> = {}
    ): Promise<PermissionCheckResult<Permission>> {
        const permissions = await this.findMatchingPermissions(userId, resourcePath, action);

        // Find deny rules first (higher priority)
        const denyRule = permissions.find((p) => p.effect === "deny" && p.actions.includes(action));
        if (denyRule) {
            return {
                allowed: false,
                matchedRules: permissions,
                deniedBy: denyRule,
                reason: denyRule.reason || "Permission explicitly denied"
            };
        }

        // Check allow rules
        const allowRule = permissions.find((p) => p.effect === "allow" && (p.actions.includes(action) || p.actions.includes("manage")));

        return {
            allowed: !!allowRule,
            matchedRules: permissions,
            reason: allowRule ? "Permission granted" : "No matching permission found"
        };
    }

    /**
     * Revoke permissions by template ID
     */
    async revokeByTemplate(userId: string, templateId: string): Promise<number> {
        const result = await this.collection.updateMany({ userId, templateId, isActive: true }, { $set: { isActive: false, updatedAt: new Date() } });

        // Clear cache for this user
        this.clearUserCache(userId);

        // Sync permissions to user document
        await this.syncPermissionsToUser(userId);

        return result.modifiedCount;
    }

    /**
     * Find permission by ID
     */
    async findById(id: string): Promise<Permission | null> {
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }

    /**
     * Find permissions by user ID
     */
    async findByUserId(userId: string, options?: { includeInactive?: boolean; templateId?: string }): Promise<Permission[]> {
        const query: Record<string, unknown> = { userId };

        if (!options?.includeInactive) {
            query.isActive = true;
        }

        if (options?.templateId) {
            query.templateId = options.templateId;
        }

        return await this.collection.find(query).sort({ createdAt: -1 }).toArray();
    }

    /**
     * Delete (soft delete) permission by ID
     */
    async deleteById(id: string): Promise<boolean> {
        const result = await this.collection.updateOne({ _id: new ObjectId(id) }, { $set: { isActive: false, updatedAt: new Date() } });

        if (result.modifiedCount > 0) {
            // Get permission to clear user cache
            const permission = await this.findById(id);
            if (permission) {
                this.clearUserCache(permission.userId);
                await this.syncPermissionsToUser(permission.userId);
            }
        }

        return result.modifiedCount > 0;
    }

    /**
     * Sync permissions to Better Auth user document
     */
    async syncPermissionsToUser(userId: string): Promise<void> {
        const permissions = await this.getUserPermissions(userId);
        await this.userRepository.syncPermissions(userId, permissions);
    }

    /**
     * Clear all cached permissions for a user
     */
    clearUserCache(userId: string): void {
        // Clear permission cache
        const keys = Array.from(permissionCache.keys());
        keys.forEach((key) => {
            if (key.startsWith(`${userId}:`)) {
                permissionCache.delete(key);
            }
        });

        // Clear ability cache
        const abilityKeys = Array.from(abilityCache.keys());
        abilityKeys.forEach((key) => {
            if (key.startsWith(`ability:${userId}:`)) {
                abilityCache.delete(key);
            }
        });
    }

    /**
     * Clear all caches (useful for testing)
     */
    clearAllCaches(): void {
        permissionCache.clear();
        abilityCache.clear();
    }

    /**
     * Create indexes for permission collection
     */
    async createIndexes(): Promise<void> {
        // Single field indexes
        await this.collection.createIndex({ userId: 1 });
        await this.collection.createIndex({ templateId: 1 });
        await this.collection.createIndex({ isActive: 1 });
        await this.collection.createIndex({ pathDepth: 1 });

        // Compound indexes for efficient queries
        await this.collection.createIndex({ userId: 1, isActive: 1, pathDepth: 1 });
        await this.collection.createIndex({ userId: 1, "resourcePath.0": 1 });
        await this.collection.createIndex({ userId: 1, templateId: 1 });

        // TTL index for automatic expiration
        await this.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    }

    /**
     * Create a permission directly (for superadmin initialization)
     */
    async createPermission(permission: Omit<Permission, "_id">): Promise<Permission> {
        const result = await this.collection.insertOne(permission);
        return { ...permission, _id: result.insertedId };
    }
}
