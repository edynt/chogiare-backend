#!/usr/bin/env node

/**
 * Script to test database connection
 * Usage: node scripts/test-db-connection.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    console.log(`Database URL: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')}`);
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');

    // Test query
    const result = await prisma.$queryRaw`SELECT version() as version`;
    console.log('📊 PostgreSQL version:', result[0]?.version);

    // Test table access
    const userCount = await prisma.user.count();
    console.log(`📈 Users in database: ${userCount}`);

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check DATABASE_URL in .env file');
    console.error('2. Ensure Supabase is running (if local)');
    console.error('3. Check network connectivity');
    console.error('4. Verify database credentials');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

