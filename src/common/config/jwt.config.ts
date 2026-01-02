import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  // Admin-specific secrets for complete separation
  adminSecret: process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET || 'your-admin-secret-key',
  adminRefreshSecret:
    process.env.JWT_ADMIN_REFRESH_SECRET ||
    process.env.JWT_REFRESH_SECRET ||
    'your-admin-refresh-secret-key',
}));
