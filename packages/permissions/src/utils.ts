import type { AppAbility, Actions } from "./types";

/**
 * Helper function to check if user can perform action on subject
 * Returns boolean for UI conditional rendering
 */
export function canUser(ability: AppAbility, action: Actions, subject: string, data?: Record<string, unknown>): boolean {
    return ability.can(action, subject, data);
}

/**
 * Helper function to check if user cannot perform action
 */
export function cannotUser(ability: AppAbility, action: Actions, subject: string, data?: Record<string, unknown>): boolean {
    return ability.cannot(action, subject, data);
}

/**
 * Check permission and throw error if denied
 * Useful for route handlers
 */
export function checkPermission(ability: AppAbility, action: Actions, subject: string, data?: Record<string, unknown>): void {
    if (ability.cannot(action, subject, data)) {
        const dataStr = data ? ` (with data: ${JSON.stringify(data)})` : "";
        throw new Error(`Forbidden: Cannot ${action} ${subject}${dataStr}`);
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
 * Check if data matches Mongo-like conditions
 */
export function matchCondition(data: Record<string, unknown>, conditions: Record<string, unknown>): boolean {
    for (const [key, requirement] of Object.entries(conditions)) {
        const value = getNestedValue(data, key);

        if (requirement && typeof requirement === "object" && !Array.isArray(requirement)) {
            const operators = requirement as Record<string, unknown>;
            const keys = Object.keys(operators);
            const isOperator = keys.some(k => k.startsWith('$'));

            if (isOperator) {
                for (const [op, opValue] of Object.entries(operators)) {
                    switch (op) {
                        case "$eq":
                            if (value !== opValue) return false;
                            break;
                        case "$ne":
                            if (value === opValue) return false;
                            break;
                        case "$gt":
                            if (!(typeof value === "number" && typeof opValue === "number" && value > opValue)) return false;
                            break;
                        case "$gte":
                            if (!(typeof value === "number" && typeof opValue === "number" && value >= opValue)) return false;
                            break;
                        case "$lt":
                            if (!(typeof value === "number" && typeof opValue === "number" && value < opValue)) return false;
                            break;
                        case "$lte":
                            if (!(typeof value === "number" && typeof opValue === "number" && value <= opValue)) return false;
                            break;
                        case "$in":
                            if (!(Array.isArray(opValue) && opValue.includes(value))) return false;
                            break;
                        case "$nin":
                            if (!(Array.isArray(opValue) && !opValue.includes(value))) return false;
                            break;
                        case "$exists":
                            if (opValue === true && value === undefined) return false;
                            if (opValue === false && value !== undefined) return false;
                            break;
                        default:
                            // If it starts with $ but unknown, we should probably ignore or fail.
                            // For simplicity, treat unknown $ as mismatch if it was intended as operator.
                            if (op.startsWith('$')) return false;
                    }
                }
            } else {
                // Literal object comparison if no $ operators found
                if (JSON.stringify(value) !== JSON.stringify(requirement)) return false;
            }
        } else {
            // Simple equality check
            if (value !== requirement) return false;
        }
    }
    return true;
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
