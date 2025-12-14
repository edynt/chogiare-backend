import { registerAs } from '@nestjs/config';
import { APP_NAME } from '@common/constants/app.constants';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api',
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  name: process.env.APP_NAME || APP_NAME,
}));
