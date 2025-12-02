import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined in environment variables');
  }

  // Parse database URL to extract components
  let url: URL;
  try {
    url = new URL(databaseUrl.replace(/^postgresql:\/\//, 'http://'));
  } catch (error) {
    // If URL parsing fails, return minimal config
    return {
      url: databaseUrl,
      host: 'localhost',
      port: 5433,
      database: 'postgres',
      username: 'postgres',
      password: '',
      schema: 'public',
      ssl: false,
      pool: {
        min: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
        max: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
        idleTimeoutMillis: parseInt(process.env.DATABASE_POOL_IDLE_TIMEOUT || '30000', 10),
      },
    };
  }
  
  return {
    url: databaseUrl,
    host: url.hostname,
    port: parseInt(url.port || '5432', 10),
    database: url.pathname.replace('/', ''),
    username: url.username,
    password: url.password,
    schema: url.searchParams.get('schema') || 'public',
    ssl: process.env.DATABASE_SSL === 'true' || url.searchParams.get('sslmode') === 'require',
    // Connection pool settings
    pool: {
      min: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
      max: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
      idleTimeoutMillis: parseInt(process.env.DATABASE_POOL_IDLE_TIMEOUT || '30000', 10),
    },
  };
});

