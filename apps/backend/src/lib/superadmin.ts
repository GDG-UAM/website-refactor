import db from "./db";

const SUPERADMIN_EMAIL = "gdguam@gmail.com";

/**
 * Initialize superadmin user on first run
 * This ensures gdguam@gmail.com always has admin role and permissions
 */
export async function initializeSuperadmin(): Promise<void> {
    try {
        const { userRepository, permissionRepository } = db.getRepositories();

        // Check if superadmin user exists
        const superadmin = await userRepository.findByEmail(SUPERADMIN_EMAIL);

        if (!superadmin) {
            return;
        }

        const userId = superadmin._id?.toString();
        if (!userId) {
            return;
        }

        // Ensure superadmin has admin role
        if (superadmin.role !== "admin") {
            await userRepository.updateRole(userId, "admin");
        }

        // Ensure superadmin has admin permissions
        const existingPerms = await permissionRepository.findByUserId(userId);
        const hasAdminPerms = existingPerms.some((p) => p.resource === "admin.*" && p.isActive);

        if (!hasAdminPerms) {
            // Create the permission document manually
            const now = new Date();
            const adminPerm = {
                userId,
                resource: "admin.*",
                resourcePath: ["admin", "*"],
                pathDepth: 2,
                actions: ["manage" as const],
                effect: "allow" as const,
                priority: 1000,
                reason: "Superadmin initialization",
                isActive: true,
                createdAt: now,
                updatedAt: now
            };

            // Use the public createPermission method
            await permissionRepository.createPermission(adminPerm);
        }

        if (!superadmin.permissions || superadmin.permissions.length === 0) {
            // Sync to user document
            await permissionRepository.syncPermissionsToUser(userId);
        }
    } catch (error) {
        console.error("[Superadmin] Error initializing superadmin:", error);
    }
}
