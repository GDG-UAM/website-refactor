import { Actions } from "@gdg-uam/permissions";
import db from "./db";

const SUPERADMIN_EMAIL = "gdguam@gmail.com";

// Default role templates
const ROLE_TEMPLATES = [
    {
        name: "role:team",
        description: "Default permissions for team members",
        permissions: [
            {
                resource: "*",
                actions: ["manage"] as Actions[],
                effect: "allow" as const,
                priority: 50
            }
        ],
        isActive: true
    },
    {
        name: "role:organizer",
        description: "Default permissions for organizers",
        permissions: [
            {
                resource: "*",
                actions: ["manage"] as Actions[],
                effect: "allow" as const,
                priority: 50
            }
        ],
        isActive: true
    }
];

/**
 * Initialize default role templates
 * Creates templates for team and organizer roles if they don't exist
 */
async function initializeRoleTemplates(): Promise<void> {
    try {
        const { permissionRepository } = db.getRepositories();

        for (const template of ROLE_TEMPLATES) {
            // Check if template already exists
            const existing = await permissionRepository.findTemplateByName(template.name);

            if (!existing) {
                await permissionRepository.createTemplate({
                    ...template
                });
            }
        }
    } catch (error) {
        console.error("[Init] Error initializing role templates:", error);
    }
}

/**
 * Initialize superadmin user on first run
 * This ensures gdguam@gmail.com always has admin role and permissions
 */
export async function initializeSuperadmin(): Promise<void> {
    try {
        const { userRepository } = db.getRepositories();

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
            await userRepository.updateRole(userId, "admin", superadmin.role ?? undefined);
        }
    } catch (error) {
        console.error("[Init] Error initializing superadmin:", error);
    }
}

/**
 * Initialize all system defaults
 * Call this on server startup
 */
export async function initializeDefaults(): Promise<void> {
    await initializeRoleTemplates();
    await initializeSuperadmin();
}
