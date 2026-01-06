/**
 * Role Constants
 * Centralized definition for all roles in the system
 * These IDs must match the role IDs in the database
 */

export const ROLES = {
  ADMIN: {
    id: 1,
    name: 'admin',
    description: 'Administrator with full system access',
  },
  USER: {
    id: 2,
    name: 'user',
    description: 'Regular user',
  },
} as const;

// Export role IDs for easy access
export const ROLE_IDS = {
  ADMIN: ROLES.ADMIN.id,
  USER: ROLES.USER.id,
} as const;

// Export role names for easy access
export const ROLE_NAMES = {
  ADMIN: ROLES.ADMIN.name,
  USER: ROLES.USER.name,
} as const;

// Map role name to ID
export const ROLE_NAME_TO_ID: Record<string, number> = {
  [ROLE_NAMES.ADMIN]: ROLE_IDS.ADMIN,
  [ROLE_NAMES.USER]: ROLE_IDS.USER,
};

// Map role ID to name
export const ROLE_ID_TO_NAME: Record<number, string> = {
  [ROLE_IDS.ADMIN]: ROLE_NAMES.ADMIN,
  [ROLE_IDS.USER]: ROLE_NAMES.USER,
};

// Type-safe role ID type
export type RoleId = (typeof ROLE_IDS)[keyof typeof ROLE_IDS];

// Type-safe role name type
export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];
