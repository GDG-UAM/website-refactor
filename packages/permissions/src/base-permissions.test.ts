import { describe, it, expect } from "bun:test";
import { AbilityBuilder } from "./types";
import { applyBasePermissions, hasGlobalAdminRole, applyGlobalAdminPermissions, applyUserPermissions } from "./base-permissions";

describe("base-permissions", () => {
    describe("applyBasePermissions", () => {
        it("should allow user to read their own data", () => {
            const builder = new AbilityBuilder();
            applyBasePermissions(builder, "u123");
            const ability = builder.build();
            expect(ability.can("read", "users.u123")).toBe(true);
            expect(ability.can("read", "users.other")).toBe(false);
        });
    });

    describe("hasGlobalAdminRole", () => {
        it("should return true if role string is admin", () => {
            expect(hasGlobalAdminRole({ id: "1", role: "admin" })).toBe(true);
        });

        it("should return false if no admin role", () => {
            expect(hasGlobalAdminRole({ id: "1", role: "user" })).toBe(false);
            expect(hasGlobalAdminRole({ id: "1" })).toBe(false);
        });
    });

    describe("applyGlobalAdminPermissions", () => {
        it("should allow everything", () => {
            const builder = new AbilityBuilder();
            applyGlobalAdminPermissions(builder);
            const ability = builder.build();
            expect(ability.can("manage", "all")).toBe(true);
            expect(ability.can("delete", "anything")).toBe(true);
        });

        it("should NOT allow deleting protected permission templates", () => {
            const builder = new AbilityBuilder();
            applyGlobalAdminPermissions(builder);
            const ability = builder.build();
            
            // Should not allow deleting specific roles
            expect(ability.can("delete", "permissiontemplates.*", { name: "role:team" })).toBe(false);
            expect(ability.can("delete", "permissiontemplates.*", { name: "role:organizer" })).toBe(false);
            
            // Should allow deleting other templates
            expect(ability.can("delete", "permissiontemplates.*", { name: "other-template" })).toBe(true);
        });
    });

    describe("applyUserPermissions", () => {
        it("should apply permissions from user object", () => {
            const builder = new AbilityBuilder();
            const user = {
                id: "u1",
                permissions: [
                    {
                        resource: "blog.post",
                        actions: ["read" as const],
                        effect: "allow" as const,
                        priority: 1
                    }
                ]
            };
            applyUserPermissions(builder, user);
            const ability = builder.build();
            expect(ability.can("read", "blog.post")).toBe(true);
            expect(ability.can("delete", "blog.post")).toBe(false);
        });

        it("should respect priority and effect", () => {
            const builder = new AbilityBuilder();
            const user = {
                id: "u1",
                permissions: [
                    {
                        resource: "blog.*",
                        actions: ["manage" as const],
                        effect: "allow" as const,
                        priority: 1
                    },
                    {
                        resource: "blog.secret",
                        actions: ["read" as const],
                        effect: "deny" as const,
                        priority: 10 // Higher priority
                    }
                ]
            };
            applyUserPermissions(builder, user);
            const ability = builder.build();
            expect(ability.can("read", "blog.post")).toBe(true);
            expect(ability.can("read", "blog.secret")).toBe(false);
        });

        it("should evaluate conditions with user context", () => {
            const builder = new AbilityBuilder();
            const user = {
                id: "user_abc",
                permissions: [
                    {
                        resource: "Post",
                        actions: ["update" as const],
                        effect: "allow" as const,
                        priority: 1,
                        conditions: { creatorId: "{user.id}" }
                    }
                ]
            };
            applyUserPermissions(builder, user);
            const ability = builder.build();

            expect(ability.can("update", "Post", { creatorId: "user_abc" })).toBe(true);
            expect(ability.can("update", "Post", { creatorId: "other_user" })).toBe(false);
        });

        it("should handle complex context with extra data", () => {
            const builder = new AbilityBuilder();
            const user = {
                id: "u123",
                permissions: [
                    {
                        resource: "Team",
                        actions: ["manage" as const],
                        effect: "allow" as const,
                        priority: 1,
                        conditions: { orgId: "{org.id}" }
                    }
                ]
            };
            const context = { org: { id: "org_999" } };
            applyUserPermissions(builder, user, context);
            const ability = builder.build();

            expect(ability.can("manage", "Team", { orgId: "org_999" })).toBe(true);
            expect(ability.can("manage", "Team", { orgId: "org_000" })).toBe(false);
        });
    });
});
