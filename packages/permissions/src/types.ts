// Generic condition query type for permissions (database-agnostic)
export type ConditionQuery = Record<string, unknown>;

// Permission actions
export type Actions = "create" | "read" | "update" | "delete" | "manage";

// Permission rule for database-agnostic ability system
export interface PermissionRule {
    action: Actions | Actions[];
    subject: string | string[];
    conditions?: ConditionQuery;
    inverted: boolean; // true for "cannot", false for "can"
}

// Database-agnostic ability class
export class Ability {
    private rules: PermissionRule[] = [];

    constructor(rules: PermissionRule[] = []) {
        this.rules = rules;
    }

    can(action: Actions, subject: string, data?: any): boolean {
        return this.checkPermission(action, subject, data, false);
    }

    cannot(action: Actions, subject: string, data?: any): boolean {
        return !this.can(action, subject, data);
    }

    canUpdateAnyField(subject: string, data: any, options?: { ignore?: string[] }): boolean {
        if (this.can("update", subject)) return true;
        if (!data || typeof data !== "object") return false;

        const ignore = options?.ignore || ["_id", "isActive", "createdAt", "updatedAt", "createdBy", "__v"];
        return Object.keys(data).some((field) => !ignore.includes(field) && this.can("update", subject, { field }));
    }

    private checkPermission(action: Actions, subject: string, data: any | undefined, inverted: boolean): boolean {
        // Find matching rules (deny rules checked first due to higher priority)
        const denyRules = this.rules.filter((rule) => rule.inverted);
        const allowRules = this.rules.filter((rule) => !rule.inverted);

        // Check deny rules first
        for (const rule of denyRules) {
            if (this.matchesRule(rule, action, subject, data)) {
                return inverted; // Denied
            }
        }

        // Check allow rules
        for (const rule of allowRules) {
            if (this.matchesRule(rule, action, subject, data)) {
                return !inverted; // Allowed
            }
        }

        return inverted; // Default: deny
    }

    private matchesRule(rule: PermissionRule, action: Actions, subject: string, data?: any): boolean {
        // Check action match
        const actions = Array.isArray(rule.action) ? rule.action : [rule.action];
        const actionMatches = actions.includes(action) || 
                             actions.includes("manage") || 
                             (!rule.inverted && action === "read" && actions.includes("update"));

        if (!actionMatches) {
            return false;
        }

        // Check subject match
        const subjects = Array.isArray(rule.subject) ? rule.subject : [rule.subject];
        let subjectMatches = false;
        
        // First check for exact matches or "all"
        if (subjects.includes(subject) || subjects.includes("all")) {
            subjectMatches = true;
        } else {
            // Check for hierarchical matches or wildcard pattern matching
            for (const ruleSubject of subjects) {
                // Hierarchical match: ruleSubject is a parent of subject
                // e.g., "admin.links" matches "admin.links.123"
                if (subject.startsWith(`${ruleSubject}.`)) {
                    subjectMatches = true;
                    break;
                }

                // Reverse hierarchical match: ruleSubject is a child of subject
                // e.g., ruleSubject "admin.links" matches subject "admin" ONLY for action "read"
                // This allows the user to "read" the parent container if they have access to something inside.
                if (action === "read" && ruleSubject.startsWith(`${subject}.`)) {
                    subjectMatches = true;
                    break;
                }

                if (ruleSubject.includes("*") || ruleSubject.includes("{")) {
                    // Import pattern matching at runtime
                    const { parsePattern, matchesPattern } = require("./parser");
                    const pattern = parsePattern(ruleSubject);
                    const targetPath = subject.split(".");

                    if (matchesPattern(pattern.segments, targetPath)) {
                        subjectMatches = true;
                        break;
                    }
                }
            }
        }

        if (!subjectMatches) {
            return false;
        }

        // Check conditions match
        if (rule.conditions && Object.keys(rule.conditions).length > 0) {
            const { matchCondition } = require("./utils");

            // Normalize data for field-level checks
            const checkData = data ? { ...data } : undefined;
            if (checkData && checkData.field && !checkData.fields) {
                checkData.fields = checkData.field;
            }

            // "reads are not restricted by fields"
            // If checking "read", we ignore the 'field' or 'fields' constraint in the rule
            if (action === "read") {
                const filteredConditions = { ...rule.conditions };
                delete (filteredConditions as any).field;
                delete (filteredConditions as any).fields;

                // If no conditions left, it's a field-only constraint, allow read
                if (Object.keys(filteredConditions).length === 0) {
                    return true;
                }

                // If data is missing but there are non-field conditions, fail
                if (!checkData) return false;

                return matchCondition(checkData, filteredConditions);
            }

            if (!checkData) {
                return false; // Conditions required but no data provided
            }

            if (!matchCondition(checkData, rule.conditions)) {
                return false;
            }
        }

        return true;
    }

    hasSectionPermissions(section: string): boolean {
        // Find matching rules
        const denyRules = this.rules.filter((rule) => rule.inverted);
        const allowRules = this.rules.filter((rule) => !rule.inverted);

        // Check if there is any ALLOW rule that covers this section or any sub-resource of it
        let isSectionAllowed = false;
        for (const rule of allowRules) {
            const subjects = Array.isArray(rule.subject) ? rule.subject : [rule.subject];
            
            if (subjects.includes("all")) {
                isSectionAllowed = true;
                break;
            }

            for (const subj of subjects) {
                // Case 1: Subj matches exactly, is a child of the section, or is a parent of the section
                // e.g., subj="admin" allows section="admin.users" (parent matches child)
                // e.g., subj="admin.users" allows section="admin" (child matches parent context)
                if (subj === section || subj.startsWith(`${section}.`) || section.startsWith(`${subj}.`)) {
                    isSectionAllowed = true;
                    break;
                }

                // Case 2: Subj covers the section via wildcard (e.g., subj="admin.*", section="admin.users")
                if (subj.includes("*") || subj.includes("{")) {
                    const { parsePattern, matchesPattern } = require("./parser");
                    const pattern = parsePattern(subj);
                    const targetPath = section.split(".");
                    if (matchesPattern(pattern.segments, targetPath)) {
                        isSectionAllowed = true;
                        break;
                    }
                }
            }
            if (isSectionAllowed) break;
        }

        if (!isSectionAllowed) return false;

        // A section is completely denied ONLY if there's a deny rule for the section itself or its parent
        // (If only a sub-resource is denied, the section as a whole still has some allowed parts)
        for (const rule of denyRules) {
            const subjects = Array.isArray(rule.subject) ? rule.subject : [rule.subject];
            if (subjects.includes("all")) return false; // Everything denied

            for (const subj of subjects) {
                // Deny rule for the exact section or a parent prefix
                if (subj === section || section.startsWith(`${subj}.`)) {
                    return false;
                }

                // Deny rule covers the section via wildcard
                if (subj.includes("*") || subj.includes("{")) {
                    const { parsePattern, matchesPattern } = require("./parser");
                    const pattern = parsePattern(subj);
                    const targetPath = section.split(".");
                    if (matchesPattern(pattern.segments, targetPath)) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    getRules(): PermissionRule[] {
        return this.rules;
    }
}

// Ability builder for constructing permissions
export class AbilityBuilder {
    private rules: PermissionRule[] = [];

    can(action: Actions | Actions[], subject: string | string[], conditions?: ConditionQuery): void {
        this.rules.push({
            action,
            subject,
            conditions,
            inverted: false
        });
    }

    cannot(action: Actions | Actions[], subject: string | string[], conditions?: ConditionQuery): void {
        this.rules.push({
            action,
            subject,
            conditions,
            inverted: true
        });
    }

    build(): Ability {
        return new Ability(this.rules);
    }
}

// Type alias for compatibility
export type AppAbility = Ability;

// Permission effect
export type PermissionEffect = "allow" | "deny";

// Permission document structure
export interface PermissionDocument {
    _id?: string;
    userId: string;
    templateId?: string;

    // Original pattern for display
    resource: string; // e.g., "hackathon.{id}.teams"

    // Tokenized for efficient queries
    resourcePath: string[]; // ["hackathon", "{id}", "teams"]
    pathDepth: number;

    // Actions and effect
    actions: Actions[];
    effect: PermissionEffect;

    // Optional conditions for fine-grained control
    conditions?: ConditionQuery;

    // Priority for conflict resolution (higher = more important)
    // Default: deny = 100, allow = 50
    priority: number;

    // Metadata
    createdAt: Date;
    updatedAt: Date;
    expiresAt?: Date;
    isActive: boolean;

    // Audit
    grantedBy?: string;
    reason?: string;
}

// Permission template structure
export interface PermissionTemplateDocument {
    _id?: string;
    name: string;
    description?: string;

    // Pattern with placeholders
    pattern: string; // e.g., "hackathon.{id}.*"

    // Actions to grant (allow)
    grants: Actions[];

    // Actions to deny (forbid)
    denies: Actions[];

    // Optional base conditions
    conditions?: ConditionQuery;

    // Metadata
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;

    // Usage tracking
    usageCount?: number;
}

// Permission pattern parsing result
export interface ParsedPattern {
    segments: PatternSegment[];
    depth: number;
    hasWildcard: boolean;
    hasPlaceholder: boolean;
}

export interface PatternSegment {
    type: "literal" | "placeholder" | "wildcard";
    value: string;
    param?: string; // For placeholders: {id} -> "id"
}

// Template application input
export interface ApplyTemplateInput {
    userId: string;
    templateId: string;
    bindings: Record<string, string>; // e.g., { id: "123" }
    conditions?: ConditionQuery; // Additional conditions to merge
    expiresAt?: Date;
    grantedBy?: string;
    reason?: string;
}

// Permission check result (generic to work with any permission type)
export interface PermissionCheckResult<T = PermissionDocument> {
    allowed: boolean;
    matchedRules: T[];
    deniedBy?: T;
    reason?: string;
}