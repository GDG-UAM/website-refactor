// Export types
export type * from "./types";
export type { ConditionQuery } from "./types";
export { Ability, AbilityBuilder } from "./types";

// Export utilities
export { canUser, cannotUser, checkPermission, evaluateConditions, getNestedValue, hashResourcePath } from "./utils";

// Export parser
export { parsePattern, matchesPattern, expandPattern, validatePattern } from "./parser";

// Export base permissions
export { applyBasePermissions, hasGlobalAdminRole, applyGlobalAdminPermissions, applyUserPermissions } from "./base-permissions";
export type { PermissionUser } from "./base-permissions";
