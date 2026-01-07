import { describe, it, expect } from "bun:test";
import { Ability, AbilityBuilder } from "./types";

describe("Ability", () => {
    it("should allow if an allow rule matches", () => {
        const builder = new AbilityBuilder();
        builder.can("read", "Post");
        const ability = builder.build();
        expect(ability.can("read", "Post")).toBe(true);
    });

    it("should deny if no rule matches", () => {
        const builder = new AbilityBuilder();
        const ability = builder.build();
        expect(ability.can("read", "Post")).toBe(false);
    });

    it("should deny if a deny rule matches", () => {
        const builder = new AbilityBuilder();
        builder.can("read", "Post");
        builder.cannot("read", "Post");
        const ability = builder.build();
        expect(ability.can("read", "Post")).toBe(false);
    });

    it("should allow 'manage' to cover all actions", () => {
        const builder = new AbilityBuilder();
        builder.can("manage", "Post");
        const ability = builder.build();
        expect(ability.can("create", "Post")).toBe(true);
        expect(ability.can("read", "Post")).toBe(true);
        expect(ability.can("update", "Post")).toBe(true);
        expect(ability.can("delete", "Post")).toBe(true);
    });

    it("should allow 'all' to cover all subjects", () => {
        const builder = new AbilityBuilder();
        builder.can("read", "all");
        const ability = builder.build();
        expect(ability.can("read", "Post")).toBe(true);
        expect(ability.can("read", "User")).toBe(true);
    });

    it("should support field-specific permissions via conditions", () => {
        const ability = new Ability([
            {
                action: "read",
                subject: "User",
                conditions: { 
                    field: { $in: ["name", "email"] } 
                },
                inverted: false
            }
        ]);
        expect(ability.can("read", "User", { field: "name" })).toBe(true);
        expect(ability.can("read", "User", { field: "email" })).toBe(true);
        expect(ability.can("read", "User", { field: "password" })).toBe(false);
    });

    describe("Pattern matching in Ability", () => {
        it("should match wildcard patterns", () => {
            const builder = new AbilityBuilder();
            builder.can("read", "hackathon.*");
            const ability = builder.build();
            expect(ability.can("read", "hackathon.123")).toBe(true);
            expect(ability.can("read", "hackathon.teams")).toBe(true);
            expect(ability.can("read", "other")).toBe(false);
        });

        it("should match placeholder patterns", () => {
            const builder = new AbilityBuilder();
            builder.can("read", "hackathon.{id}.teams");
            const ability = builder.build();
            expect(ability.can("read", "hackathon.123.teams")).toBe(true);
            expect(ability.can("read", "hackathon.any.teams")).toBe(true);
            expect(ability.can("read", "hackathon.123.members")).toBe(false);
        });
    });

    describe("Context-based permissions (Mongo-like Conditions)", () => {
        it("should allow deleting an event if user is the creator ($eq)", () => {
            const builder = new AbilityBuilder();
            builder.can("delete", "Event", { createdBy: "user_123" });
            const ability = builder.build();

            expect(ability.can("delete", "Event", { createdBy: "user_123" })).toBe(true);
            expect(ability.can("delete", "Event", { createdBy: "user_456" })).toBe(false);
        });

        it("should support $ne operator", () => {
            const builder = new AbilityBuilder();
            builder.can("read", "Project", { status: { $ne: "archived" } });
            const ability = builder.build();

            expect(ability.can("read", "Project", { status: "active" })).toBe(true);
            expect(ability.can("read", "Project", { status: "archived" })).toBe(false);
        });

        it("should support numeric comparison operators ($gt, $lte)", () => {
            const builder = new AbilityBuilder();
            builder.can("manage", "Team", { memberCount: { $lt: 5 } });
            const ability = builder.build();

            expect(ability.can("manage", "Team", { memberCount: 3 })).toBe(true);
            expect(ability.can("manage", "Team", { memberCount: 5 })).toBe(false);
        });

        it("should support $in operator", () => {
            const builder = new AbilityBuilder();
            builder.can("read", "Post", { category: { $in: ["tech", "news"] } });
            const ability = builder.build();

            expect(ability.can("read", "Post", { category: "tech" })).toBe(true);
            expect(ability.can("read", "Post", { category: "random" })).toBe(false);
        });

        it("should support $exists operator", () => {
            const builder = new AbilityBuilder();
            builder.can("read", "Profile", { bio: { $exists: true } });
            const ability = builder.build();

            expect(ability.can("read", "Profile", { bio: "hello" })).toBe(true);
            expect(ability.can("read", "Profile", { bio: undefined })).toBe(false);
            expect(ability.can("read", "Profile", {})).toBe(false);
        });

        it("should support nested object matching", () => {
            const builder = new AbilityBuilder();
            builder.can("update", "User", { "settings.notifications": true });
            const ability = builder.build();

            expect(ability.can("update", "User", { settings: { notifications: true } })).toBe(true);
            expect(ability.can("update", "User", { settings: { notifications: false } })).toBe(false);
        });

        it("should combine multiple conditions", () => {
            const builder = new AbilityBuilder();
            builder.can("create", "BlogPost", { 
                authorId: "u123",
                status: "draft",
                "meta.wordCount": { $gt: 100 }
            });
            const ability = builder.build();

            const validPost = { authorId: "u123", status: "draft", meta: { wordCount: 150 } };
            const invalidPost = { authorId: "u123", status: "draft", meta: { wordCount: 50 } };

            expect(ability.can("create", "BlogPost", validPost)).toBe(true);
            expect(ability.can("create", "BlogPost", invalidPost)).toBe(false);
        });
    });
});
