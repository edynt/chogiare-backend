import { registerAs } from '@nestjs/config';
import { APP_NAME } from '@common/constants/app.constants';

export default registerAs('mail', () => ({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT || '587', 10),
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER || '',
    pass: process.env.MAIL_PASSWORD || '',
  },
  from: {
    name: process.env.MAIL_FROM_NAME || APP_NAME,
    email: process.env.MAIL_FROM_EMAIL || process.env.MAIL_USER || '',
  },
}));

