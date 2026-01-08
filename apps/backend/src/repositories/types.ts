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

// ==================== Article Types ====================

export type ArticleType = "blog" | "newsletter";
export type ArticleStatus = "draft" | "published" | "url_only";

export interface Article {
    _id: ObjectId;
    type: ArticleType;
    title: Record<string, string>;
    slug: string;
    excerpt?: Record<string, string>;
    content: Record<string, string>;
    coverImage?: string;
    coverImageBlurHash?: string;
    coverImageWidth?: number;
    coverImageHeight?: number;
    status: ArticleStatus;
    authors: string[]; // User IDs as strings
    views: number;
    publishedAt?: Date | null;
    isActive: boolean; // Soft delete
    createdBy: string; // User ID as string
    createdAt: Date;
    updatedAt: Date;
}

export const ArticleSchema = t.Object({
    _id: t.Optional(t.String()),
    type: t.Union([t.Literal("blog"), t.Literal("newsletter")]),
    title: t.Record(t.String(), t.String()),
    slug: t.String(),
    excerpt: t.Optional(t.Record(t.String(), t.String())),
    content: t.Record(t.String(), t.String()),
    coverImage: t.Optional(t.String()),
    coverImageBlurHash: t.Optional(t.String()),
    coverImageWidth: t.Optional(t.Number()),
    coverImageHeight: t.Optional(t.Number()),
    status: t.Union([t.Literal("draft"), t.Literal("published"), t.Literal("url_only")]),
    authors: t.Array(t.String()),
    views: t.Number({ default: 0 }),
    publishedAt: t.Optional(t.Nullable(t.Date())),
    isActive: t.Boolean({ default: true }),
    createdBy: t.String(),
    createdAt: t.Optional(t.Date()),
    updatedAt: t.Optional(t.Date())
});

// ==================== Event Types ====================

export type EventStatus = "draft" | "published";

export interface Event {
    _id: ObjectId;
    title: string;
    slug: string;
    markdownContent: string;
    description?: string;
    date: Date;
    location?: string;
    image?: string;
    imageBlurHash?: string;
    imageWidth?: number;
    imageHeight?: number;
    status: EventStatus;
    url?: string;
    blogUrl?: string;
    isActive: boolean; // Soft delete
    createdBy: string; // User ID as string
    createdAt: Date;
    updatedAt: Date;
}

export const EventSchema = t.Object({
    _id: t.Optional(t.String()),
    title: t.String(),
    slug: t.String(),
    markdownContent: t.String(),
    description: t.Optional(t.String()),
    date: t.Date(),
    location: t.Optional(t.String()),
    image: t.Optional(t.String()),
    imageBlurHash: t.Optional(t.String()),
    imageWidth: t.Optional(t.Number()),
    imageHeight: t.Optional(t.Number()),
    status: t.Union([t.Literal("draft"), t.Literal("published")]),
    url: t.Optional(t.String()),
    blogUrl: t.Optional(t.String()),
    isActive: t.Boolean({ default: true }),
    createdBy: t.String(),
    createdAt: t.Optional(t.Date()),
    updatedAt: t.Optional(t.Date())
});

// ==================== Link Types ====================

export interface Link {
    _id: ObjectId;
    slug: string;
    destination: string;
    title: string;
    description?: string;
    isActive: boolean;
    clicks: number;
    order?: number;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export const LinkSchema = t.Object({
    _id: t.Optional(t.String()),
    slug: t.String({ minLength: 1 }),
    destination: t.String({ minLength: 1 }),
    title: t.String({ minLength: 1 }),
    description: t.Optional(t.String()),
    isActive: t.Boolean({ default: true }),
    clicks: t.Number({ default: 0 }),
    order: t.Optional(t.Number()),
    createdBy: t.String(),
    createdAt: t.Date(),
    updatedAt: t.Date()
});

export const LinkInputSchema = t.Object({
    slug: t.String({ minLength: 1 }),
    destination: t.String({ minLength: 1 }),
    title: t.String({ minLength: 1 }),
    description: t.Optional(t.String()),
    isActive: t.Optional(t.Boolean()),
    order: t.Optional(t.Number())
});

export const LinksListResponseSchema = t.Object({
    items: t.Array(LinkSchema),
    total: t.Number(),
    page: t.Number(),
    pageSize: t.Number()
});
