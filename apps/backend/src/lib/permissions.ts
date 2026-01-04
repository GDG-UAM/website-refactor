import { AbilityBuilder, createMongoAbility, MongoAbility } from "@casl/ability";

// Define your actions
type Actions = "create" | "read" | "update" | "delete" | "manage";

// Define your subjects (resources)
type Subjects = "Post" | "User" | "Organization" | "all";

export type AppAbility = MongoAbility<[Actions, Subjects]>;

// Define roles and their permissions
export const defineAbilitiesFor = (user: any, activeOrganization?: any): AppAbility => {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (!user) {
        // Anonymous users - no permissions
        return build();
    }

    // Every authenticated user can read their own profile
    can("read", "User", { id: user.id });
    can("update", "User", { id: user.id });

    // Organization-based permissions
    if (activeOrganization) {
        const userRole = activeOrganization.role; // From Better Auth organization membership

        switch (userRole) {
            case "owner":
                // Owners have full control of their organization
                can("manage", "Organization", { id: activeOrganization.id });
                can("manage", "Post", { organizationId: activeOrganization.id });
                can("manage", "User", { organizationId: activeOrganization.id });
                break;

            case "admin":
                // Admins can manage most things except organization settings
                can("read", "Organization", { id: activeOrganization.id });
                can("update", "Organization", { id: activeOrganization.id });
                can("manage", "Post", { organizationId: activeOrganization.id });
                can(["read", "update"], "User", {
                    organizationId: activeOrganization.id
                });
                break;

            case "member":
                // Members have limited permissions
                can("read", "Organization", { id: activeOrganization.id });
                can("read", "Post", { organizationId: activeOrganization.id });
                can("create", "Post", {
                    organizationId: activeOrganization.id,
                    authorId: user.id
                });
                can(["update", "delete"], "Post", {
                    organizationId: activeOrganization.id,
                    authorId: user.id
                });
                break;

            default:
                // Default minimal permissions
                can("read", "Organization", { id: activeOrganization.id });
                break;
        }
    }

    return build();
};

// Helper to check permissions
export const checkPermission = (ability: AppAbility, action: Actions, subject: Subjects, field?: any) => {
    if (!ability.can(action, subject, field)) {
        throw new Error(`Forbidden: Cannot ${action} ${subject}`);
    }
};
