// Generic condition query type for permissions (database-agnostic)
export type ConditionQuery = Record<string, unknown>;

// Permission actions
export type Actions = "create" | "read" | "update" | "delete" | "manage";

// Permission subjects - extend as needed
export type Subjects =
    | "Post"
    | "User"
    | "Organization"
    | "Event"
    | "Blog"
    | "Newsletter"
    | "Certificate"
    | "Hackathon"
    | "Team"
    | "Giveaway"
    | "Link"
    | "FeatureFlag"
    | "all"
    | string; // Allow dynamic subjects for pattern-based permissions

// Permission rule for database-agnostic ability system
export interface PermissionRule {
    action: Actions | Actions[];
    subject: Subjects | Subjects[];
    conditions?: ConditionQuery;
    inverted: boolean; // true for "cannot", false for "can"
    fields?: string[];
}

// Database-agnostic ability class
export class Ability {
    private rules: PermissionRule[] = [];

    constructor(rules: PermissionRule[] = []) {
        this.rules = rules;
    }

    can(action: Actions, subject: Subjects, field?: string): boolean {
        return this.checkPermission(action, subject, field, false);
    }

    cannot(action: Actions, subject: Subjects, field?: string): boolean {
        return !this.can(action, subject, field);
    }

    private checkPermission(action: Actions, subject: Subjects, field: string | undefined, inverted: boolean): boolean {
        // Find matching rules (deny rules checked first due to higher priority)
        const denyRules = this.rules.filter((rule) => rule.inverted);
        const allowRules = this.rules.filter((rule) => !rule.inverted);

        // Check deny rules first
        for (const rule of denyRules) {
            if (this.matchesRule(rule, action, subject, field)) {
                return inverted; // Denied
            }
        }

        // Check allow rules
        for (const rule of allowRules) {
            if (this.matchesRule(rule, action, subject, field)) {
                return !inverted; // Allowed
            }
        }

        return inverted; // Default: deny
    }

    private matchesRule(rule: PermissionRule, action: Actions, subject: Subjects, field?: string): boolean {
        // Check action match
        const actions = Array.isArray(rule.action) ? rule.action : [rule.action];
        const actionMatches = actions.includes(action) || actions.includes("manage");

        if (!actionMatches) {
            return false;
        }

        // Check subject match
        const subjects = Array.isArray(rule.subject) ? rule.subject : [rule.subject];
        const subjectMatches = subjects.includes(subject) || subjects.includes("all");

        if (!subjectMatches) {
            return false;
        }

        // Check field match
        if (field && rule.fields && rule.fields.length > 0) {
            return rule.fields.includes(field);
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

    can(action: Actions | Actions[], subject: Subjects | Subjects[], conditions?: ConditionQuery): void {
        this.rules.push({
            action,
            subject,
            conditions,
            inverted: false
        });
    }

    cannot(action: Actions | Actions[], subject: Subjects | Subjects[], conditions?: ConditionQuery): void {
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