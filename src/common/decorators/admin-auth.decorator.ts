import { SetMetadata } from '@nestjs/common';

export const IS_ADMIN_AUTH_KEY = 'isAdminAuth';

/**
 * Marks a route as using admin authentication.
 * This tells the global JwtAuthGuard to skip this route,
 * allowing JwtAdminAuthGuard to handle authentication instead.
 */
export const AdminAuth = () => SetMetadata(IS_ADMIN_AUTH_KEY, true);
