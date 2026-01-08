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
                action: "update",
                subject: "User",
                conditions: { 
                    field: { $in: ["name", "email"] } 
                },
                inverted: false
            }
        ]);
        expect(ability.can("update", "User", { field: "name" })).toBe(true);
        expect(ability.can("update", "User", { field: "email" })).toBe(true);
        expect(ability.can("update", "User", { field: "password" })).toBe(false);
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

        it("should match hierarchical literal paths", () => {
            const builder = new AbilityBuilder();
            builder.can("read", "admin.links");
            builder.can("update", "admin.links");
            const ability = builder.build();
            expect(ability.can("read", "admin.links.123")).toBe(true);
            expect(ability.can("update", "admin.links.123")).toBe(true);
            expect(ability.can("read", "admin.links.user.profile")).toBe(true);
            expect(ability.can("update", "admin.links.user.profile")).toBe(true);
            expect(ability.can("read", "admin.other")).toBe(false);
            expect(ability.can("update", "admin.other")).toBe(false);
            expect(ability.can("read", "admin")).toBe(true); // Reverse match for read
            expect(ability.can("update", "admin")).toBe(false); // No reverse match for update
            
            // Testing implicit read from update
            const updateOnlyBuilder = new AbilityBuilder();
            updateOnlyBuilder.can("update", "admin.links");
            const updateOnlyAbility = updateOnlyBuilder.build();
            expect(updateOnlyAbility.can("read", "admin.links")).toBe(true); // Should imply read
        });

        it("should allow read even with field restrictions", () => {
            const builder = new AbilityBuilder();
            builder.can("read", "admin.links", { field: { $in: ["title"] } });
            builder.can("update", "admin.links", { field: { $in: ["title"] } });
            const ability = builder.build();
            
            // Read should be allowed for any field (per user request)
            expect(ability.can("read", "admin.links", { field: "title" })).toBe(true);
            expect(ability.can("read", "admin.links", { field: "destination" })).toBe(true);
            
            // Update should be restricted
            expect(ability.can("update", "admin.links", { field: "title" })).toBe(true);
            expect(ability.can("update", "admin.links", { field: "destination" })).toBe(false);

            // Read with NO data should be allowed if conditions are only field-based
            expect(ability.can("read", "admin.links")).toBe(true);
        });

        it("should handle plural 'fields' condition and allow read", () => {
            const builder = new AbilityBuilder();
            builder.can("read", "admin.links", { fields: { $in: ["title", "description"] } });
            builder.can("update", "admin.links", { fields: { $in: ["title", "description"] } });
            const ability = builder.build();

            // Read should be allowed even without data
            expect(ability.can("read", "admin.links")).toBe(true);
            
            // Checking with specific field
            expect(ability.can("read", "admin.links", { field: "destination" })).toBe(true);
            
            // Update should be restricted (using singular 'field' in check against plural 'fields' in rule)
            expect(ability.can("update", "admin.links", { field: "title" })).toBe(true);
            expect(ability.can("update", "admin.links", { field: "destination" })).toBe(false);
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

    describe("hasSectionPermissions", () => {
        it("should return true if user has 'all' permission", () => {
            const builder = new AbilityBuilder();
            builder.can("manage", "all");
            const ability = builder.build();
            expect(ability.hasSectionPermissions("admin")).toBe(true);
            expect(ability.hasSectionPermissions("hackathon")).toBe(true);
        });

        it("should return true if user has prefix permission", () => {
            const builder = new AbilityBuilder();
            builder.can("read", "admin.users");
            const ability = builder.build();
            expect(ability.hasSectionPermissions("admin")).toBe(true);
        });

        it("should return true if user has wildcard prefix permission", () => {
            const builder = new AbilityBuilder();
            builder.can("read", "admin.*");
            const ability = builder.build();
            expect(ability.hasSectionPermissions("admin")).toBe(true);
            expect(ability.hasSectionPermissions("admin.users")).toBe(true);
        });

        it("should return false if entire section is denied", () => {
            const builder = new AbilityBuilder();
            builder.can("manage", "all");
            builder.cannot("manage", "admin");
            const ability = builder.build();
            expect(ability.hasSectionPermissions("admin")).toBe(false);
            expect(ability.hasSectionPermissions("hackathon")).toBe(true);
        });

        it("should return false if entire section is denied via wildcard", () => {
            const builder = new AbilityBuilder();
            builder.can("manage", "all");
            builder.cannot("manage", "admin.*");
            const ability = builder.build();
            expect(ability.hasSectionPermissions("admin")).toBe(false);
            expect(ability.hasSectionPermissions("admin.users")).toBe(false);
        });

        it("should return true if only a sub-resource is denied", () => {
            const builder = new AbilityBuilder();
            builder.can("manage", "admin.*");
            builder.cannot("manage", "admin.secrets");
            const ability = builder.build();
            expect(ability.hasSectionPermissions("admin")).toBe(true);
            expect(ability.hasSectionPermissions("admin.secrets")).toBe(false);
        });
    });
});
