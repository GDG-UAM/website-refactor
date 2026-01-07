import { t } from "elysia";
import type { Actions, ConditionQuery } from "@gdg-uam/permissions";
import type { ObjectId } from "mongodb";
import { auth } from "../lib/auth";

// ==================== Serializable Permission Types ====================

/**
 * Serializable permission format (without MongoDB-specific fields)
 * Used for session storage and API responses
 */
export interface SerializablePermission {
    resource: string;
    actions: Actions[];
    effect: "allow" | "deny";
    conditions?: ConditionQuery;
    priority: number;
}

// ==================== Elysia Schema Helpers ====================

// Reusable schema for Actions
export const ActionsSchema = t.Union([t.Literal("create"), t.Literal("read"), t.Literal("update"), t.Literal("delete"), t.Literal("manage")]);

// ==================== Permission Types ====================

export interface Permission {
    resource: string;
    actions: Actions[];
    effect: "allow" | "deny";
    conditions?: ConditionQuery;
    priority: number;
    createdAt?: Date;
    updatedAt?: Date;
}

// Elysia validation schema for Permission
export const PermissionSchema = t.Object({
    _id: t.Optional(t.String()),
    resource: t.String({ minLength: 1 }),
    actions: t.Array(ActionsSchema, { minItems: 1 }),
    effect: t.Union([t.Literal("allow"), t.Literal("deny")]),
    conditions: t.Optional(t.Record(t.String(), t.Any())),
    priority: t.Number({ default: 50 }),
    createdAt: t.Optional(t.Date()),
    updatedAt: t.Optional(t.Date())
});

// ==================== Permission Template Types ====================

export interface PermissionTemplate {
    _id?: ObjectId;
    name: string;
    description?: string;
    permissions: SerializablePermission[];
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

// Elysia validation schema for PermissionTemplate
export const PermissionTemplateSchema = t.Object({
    _id: t.Optional(t.String()),
    name: t.String({ minLength: 1 }),
    description: t.Optional(t.String()),
    permissions: t.Array(
        t.Object({
            resource: t.String({ minLength: 1 }),
            actions: t.Array(ActionsSchema, { minItems: 1 }),
            effect: t.Union([t.Literal("allow"), t.Literal("deny")]),
            conditions: t.Optional(t.Record(t.String(), t.Any())),
            priority: t.Number({ default: 50 })
        })
    ),
    isActive: t.Boolean({ default: true }),
    createdAt: t.Optional(t.Date()),
    updatedAt: t.Optional(t.Date())
});

// ==================== User Types ====================

// Remove id and add objectid _id
// Update User type to include permission-related fields
export type User = Omit<typeof auth.$Infer.Session.user, "id"> & {
    _id: ObjectId;
    // Template IDs that this user is assigned to (references to PermissionTemplate._id)
    templatesUsed?: string[]; // ObjectIds as strings
    // Individual permissions granted directly to this user
    individualPermissions?: SerializablePermission[];
    // Computed permissions from templates (denormalized for performance)
    templatePermissions?: SerializablePermission[];
};
