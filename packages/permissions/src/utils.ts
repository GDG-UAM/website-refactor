import type { AppAbility, Actions, Subjects } from "./types";

/**
 * Helper function to check if user can perform action on subject
 * Returns boolean for UI conditional rendering
 */
export function canUser(ability: AppAbility, action: Actions, subject: Subjects, field?: string): boolean {
    return ability.can(action, subject, field);
}

/**
 * Helper function to check if user cannot perform action
 */
export function cannotUser(ability: AppAbility, action: Actions, subject: Subjects, field?: string): boolean {
    return ability.cannot(action, subject, field);
}

/**
 * Check permission and throw error if denied
 * Useful for route handlers
 */
export function checkPermission(ability: AppAbility, action: Actions, subject: Subjects, field?: string): void {
    if (ability.cannot(action, subject, field)) {
        const fieldStr = field ? ` (field: ${field})` : "";
        throw new Error(`Forbidden: Cannot ${action} ${subject}${fieldStr}`);
    }
}

/**
 * Evaluate condition templates with runtime values
 * Replaces {user.id}, {org.id}, etc. with actual values
 */
export function evaluateConditions(conditions: Record<string, unknown> | undefined, context: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!conditions) return undefined;

    const evaluated = JSON.parse(JSON.stringify(conditions)) as Record<string, unknown>;

    function replaceTemplates(obj: unknown): unknown {
        if (typeof obj === "string" && obj.startsWith("{") && obj.endsWith("}")) {
            const path = obj.slice(1, -1);
            return getNestedValue(context, path);
        }
        if (Array.isArray(obj)) {
            return obj.map(replaceTemplates);
        }
        if (typeof obj === "object" && obj !== null) {
            return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, replaceTemplates(v)]));
        }
        return obj;
    }

    return replaceTemplates(evaluated) as Record<string, unknown>;
}

/**
 * Get nested value from object using dot notation
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split(".").reduce((acc: unknown, part: string) => {
        if (acc && typeof acc === "object" && part in acc) {
            return (acc as Record<string, unknown>)[part];
        }
        return undefined;
    }, obj);
}

/**
 * Hash a resource path for cache keys
 */
export function hashResourcePath(path: string): string {
    // Simple hash for cache keys - could use crypto for production
    let hash = 0;
    for (let i = 0; i < path.length; i++) {
        const char = path.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}
