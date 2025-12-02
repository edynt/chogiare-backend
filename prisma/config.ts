/**
 * Prisma 7 Configuration
 * This file is used for Prisma Migrate
 * For Prisma Client, connection is passed via constructor
 */

export default {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};

