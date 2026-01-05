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
    _id?: ObjectId;
    userId: string;
    templateId?: string;
    resource: string;
    resourcePath?: string[];
    pathDepth?: number;
    actions: Actions[];
    effect: "allow" | "deny";
    conditions?: ConditionQuery;
    priority: number;
    expiresAt?: Date;
    isActive: boolean;
    grantedBy?: string;
    reason?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// Elysia validation schema for Permission
export const PermissionSchema = t.Object({
    _id: t.Optional(t.String()),
    userId: t.String({ minLength: 1 }),
    templateId: t.Optional(t.String()),
    resource: t.String({ minLength: 1 }),
    resourcePath: t.Optional(t.Array(t.String())),
    pathDepth: t.Optional(t.Number({ minimum: 0 })),
    actions: t.Array(ActionsSchema, { minItems: 1 }),
    effect: t.Union([t.Literal("allow"), t.Literal("deny")]),
    conditions: t.Optional(t.Record(t.String(), t.Any())),
    priority: t.Number({ default: 50 }),
    expiresAt: t.Optional(t.Date()),
    isActive: t.Boolean({ default: true }),
    grantedBy: t.Optional(t.String()),
    reason: t.Optional(t.String()),
    createdAt: t.Optional(t.Date()),
    updatedAt: t.Optional(t.Date())
});

// ==================== Permission Template Types ====================

export interface PermissionTemplate {
    _id?: ObjectId;
    name: string;
    description?: string;
    pattern: string;
    grants: Actions[];
    denies: Actions[];
    conditions?: ConditionQuery;
    isActive: boolean;
    usageCount: number;
    createdAt?: Date;
    updatedAt?: Date;
}

// Elysia validation schema for PermissionTemplate
export const PermissionTemplateSchema = t.Object({
    _id: t.Optional(t.String()),
    name: t.String({ minLength: 1 }),
    description: t.Optional(t.String()),
    pattern: t.String({ minLength: 1 }),
    grants: t.Array(ActionsSchema),
    denies: t.Array(ActionsSchema),
    conditions: t.Optional(t.Record(t.String(), t.Any())),
    isActive: t.Boolean({ default: true }),
    usageCount: t.Number({ default: 0 }),
    createdAt: t.Optional(t.Date()),
    updatedAt: t.Optional(t.Date())
});

// ==================== User Types ====================

// Remove id and add objectid _id
export type User = Omit<typeof auth.$Infer.Session.user, "id"> & {
    _id: ObjectId;
};
