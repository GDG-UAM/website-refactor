import type { ParsedPattern, PatternSegment } from "./types";

/**
 * Parse a permission pattern into segments
 * Examples:
 * - "hackathon.{id}.teams" -> ["hackathon", {id}, "teams"]
 * - "hackathon.*" -> ["hackathon", "*"]
 * - "blog.post.{postId}.comments.*" -> ["blog", "post", {postId}, "comments", "*"]
 */
export function parsePattern(pattern: string): ParsedPattern {
    const segments: PatternSegment[] = pattern.split(".").map((segment) => {
        // Placeholder: {id}, {userId}, etc.
        if (segment.startsWith("{") && segment.endsWith("}")) {
            return {
                type: "placeholder",
                value: segment,
                param: segment.slice(1, -1)
            };
        }

        // Wildcard: *
        if (segment === "*") {
            return {
                type: "wildcard",
                value: "*"
            };
        }

        // Literal segment
        return {
            type: "literal",
            value: segment
        };
    });

    return {
        segments,
        depth: segments.length,
        hasWildcard: segments.some((s) => s.type === "wildcard"),
        hasPlaceholder: segments.some((s) => s.type === "placeholder")
    };
}

/**
 * Check if a parsed pattern matches a target resource path
 * @param pattern - Parsed pattern with wildcards/placeholders
 * @param targetPath - Array of resource path segments
 * @returns true if pattern matches
 */
export function matchesPattern(pattern: PatternSegment[], targetPath: string[]): boolean {
    // Wildcard at the end matches any remaining segments
    const hasTrailingWildcard = pattern.length > 0 && pattern[pattern.length - 1]?.type === "wildcard";

    // Without trailing wildcard, lengths must match
    if (!hasTrailingWildcard && pattern.length !== targetPath.length) {
        return false;
    }

    // With trailing wildcard, pattern can be shorter
    if (hasTrailingWildcard && pattern.length > targetPath.length + 1) {
        return false;
    }

    // Match each segment
    for (let i = 0; i < pattern.length; i++) {
        const segment = pattern[i];
        if (!segment) continue;

        // Trailing wildcard matches rest of path
        if (segment.type === "wildcard" && i === pattern.length - 1) {
            return true;
        }

        // Non-trailing wildcard matches exactly one segment
        if (segment.type === "wildcard") {
            if (i >= targetPath.length) return false;
            continue;
        }

        // Placeholder matches any value
        if (segment.type === "placeholder") {
            if (i >= targetPath.length) return false;
            continue;
        }

        // Literal must match exactly
        if (segment.value !== targetPath[i]) {
            return false;
        }
    }

    return true;
}

/**
 * Expand a pattern with bindings to create a concrete resource path
 * @param pattern - Pattern with placeholders like "hackathon.{id}.teams"
 * @param bindings - Values for placeholders like { id: "123" }
 * @returns Expanded pattern like "hackathon.123.teams"
 */
export function expandPattern(pattern: string, bindings: Record<string, string>): string {
    let expanded = pattern;

    // Replace all placeholders with their bound values
    for (const [key, value] of Object.entries(bindings)) {
        expanded = expanded.replace(new RegExp(`\\{${key}\\}`, "g"), value);
    }

    return expanded;
}

/**
 * Validate a permission pattern syntax
 */
export function validatePattern(pattern: string): {
    valid: boolean;
    error?: string;
} {
    if (!pattern || pattern.trim().length === 0) {
        return { valid: false, error: "Pattern cannot be empty" };
    }

    const segments = pattern.split(".");

    if (segments.length === 0) {
        return { valid: false, error: "Pattern must have at least one segment" };
    }

    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        if (segment === undefined) {
            return { valid: false, error: "Pattern cannot have undefined segments" };
        }

        // Check for empty segments
        if (segment.length === 0) {
            return { valid: false, error: "Pattern cannot have empty segments" };
        }

        // Validate placeholder syntax
        if (segment.startsWith("{")) {
            if (!segment.endsWith("}")) {
                return {
                    valid: false,
                    error: `Invalid placeholder syntax: ${segment}`
                };
            }
            const param = segment.slice(1, -1);
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(param)) {
                return {
                    valid: false,
                    error: `Invalid placeholder name: ${param}`
                };
            }
        }

        // Validate wildcard position (can be anywhere but typically at end)
        if (segment === "*") {
            // Wildcards are valid anywhere
            continue;
        }

        // Validate literal segments
        if (!/^[a-zA-Z0-9_-]+$/.test(segment) && !segment.startsWith("{")) {
            return {
                valid: false,
                error: `Invalid segment: ${segment}`
            };
        }
    }

    return { valid: true };
}
