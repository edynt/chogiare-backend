import { SetMetadata } from '@nestjs/common';
import { ROLE_NAME_TO_ID } from '../constants/roles.constants';

export const ROLES_KEY = 'roles';

// Accept both string role names (legacy) and numeric roleIds
// Examples: @Roles('admin') or @Roles(ROLE_IDS.ADMIN) or @Roles('admin', 'seller')
export const Roles = (...roles: (string | number)[]) => {
  const roleIds = roles.map((role) => {
    if (typeof role === 'number') return role;
    // Convert string role name to numeric ID using centralized mapping
    return ROLE_NAME_TO_ID[role] ?? role;
  });
  return SetMetadata(ROLES_KEY, roleIds);
};
