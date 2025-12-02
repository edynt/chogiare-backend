import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as pg from 'pg';

// Load environment variables first
dotenv.config({ path: ['.env.local', '.env'] });

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  // Check DATABASE_URL first
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in environment variables');
    console.error('   → Please set DATABASE_URL in your .env file');
    console.error('   → Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?schema=public');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;

  // Test 1: Direct PostgreSQL Connection Test
  console.log('1️⃣ Testing Direct PostgreSQL Connection...');
  try {
    const client = new pg.Client({
      connectionString: databaseUrl,
    });

    await client.connect();
    console.log('✅ Direct PostgreSQL connection successful');

    const result = await client.query('SELECT 1 as test, version() as version');
    console.log('✅ Database query successful');
    console.log(`   PostgreSQL version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);

    await client.end();
  } catch (error: any) {
    console.error('❌ Direct PostgreSQL connection failed:', error?.message || error);
    if (error?.code === 'ECONNREFUSED') {
      console.error('   → Cannot reach database server. Check your DATABASE_URL host and port');
    } else if (error?.message?.includes('password authentication')) {
      console.error('   → Authentication failed. Check your database password');
    } else if (error?.message?.includes('does not exist')) {
      console.error('   → Database does not exist. Check your database name');
    }
  }

  console.log('\n');

  // Test 2: Prisma Database Connection
  console.log('2️⃣ Testing Prisma Database Connection...');

  let prisma: PrismaClient | null = null;

  try {
    // Check if using Prisma Accelerate
    if (databaseUrl.startsWith('prisma+')) {
      console.warn('⚠️  Using Prisma Accelerate. Make sure Prisma Accelerate server is running.');
      console.warn('   → For Supabase, use direct PostgreSQL connection instead:');
      console.warn('   → DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?schema=public"');

      prisma = new PrismaClient({
        log: ['error', 'warn'],
        accelerateUrl: databaseUrl,
      });
    } else if (databaseUrl.includes('[YOUR-PASSWORD]') || databaseUrl.includes('[PASSWORD]')) {
      console.error('❌ DATABASE_URL contains placeholder [YOUR-PASSWORD] or [PASSWORD]');
      console.error('   → Please replace with your actual Supabase database password');
      console.error('   → You can find it in Supabase Dashboard → Settings → Database → Connection string');
      return;
    } else {
      // Direct database connection - Prisma 7
      // Try with minimal config first
      try {
        prisma = new PrismaClient({
          log: ['error', 'warn'],
        });
      } catch (prismaError: any) {
        // If that fails, try without any config
        console.warn('⚠️  First Prisma Client initialization attempt failed, trying alternative...');
        prisma = new PrismaClient();
      }
    }

    if (prisma) {
      await prisma.$connect();
      console.log('✅ Prisma connected successfully');

      // Try a simple query
      const result = await prisma.$queryRaw`SELECT 1 as test, current_database() as db_name`;
      console.log('✅ Prisma query successful');
      console.log(`   Database: ${(result as any[])[0]?.db_name || 'N/A'}`);
    }
  } catch (error: any) {
    console.error('❌ Prisma connection failed:', error?.message || error);
    if (error?.message?.includes('P1001')) {
      console.error('   → Cannot reach database server. Check your DATABASE_URL');
    } else if (error?.message?.includes('P1000')) {
      console.error('   → Authentication failed. Check your database credentials');
    } else if (error?.message?.includes('__internal') || error?.message?.includes('undefined')) {
      console.error('   → Prisma Client initialization error');
      console.error('   → This might be a Prisma 7 compatibility issue');
      console.error('   → Try: npm install prisma@6 @prisma/client@6 --save && npm run prisma:generate');
    } else if (error?.code === 'ECONNREFUSED') {
      console.error('   → Connection refused. Check your DATABASE_URL host and port');
    } else {
      console.error('   → Error details:', error?.stack || error);
    }
  } finally {
    if (prisma) {
      try {
        await prisma.$disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
    }
  }

  console.log('\n');

  // Test 3: Supabase Client Connection
  console.log('3️⃣ Testing Supabase Client Connection...');
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️  Supabase URL or Anon Key not configured in .env');
    console.warn('   → Set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
    console.warn('   → Format: SUPABASE_URL="https://[PROJECT-REF].supabase.co"');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    });

    // Test connection by querying a table
    const { data, error } = await supabase.from('users').select('count').limit(1);

    if (error) {
      if (
        error.code === 'PGRST116' ||
        error.message.includes('relation') ||
        error.message.includes('does not exist') ||
        error.message.includes('schema cache')
      ) {
        console.log('✅ Supabase connection successful (table may not exist yet)');
        console.log('   → This is normal if you haven\'t run migrations yet');
        console.log('   → Run: npm run prisma:migrate to create tables');
      } else {
        throw error;
      }
    } else {
      console.log('✅ Supabase connection successful');
      console.log('✅ Supabase query successful');
    }
  } catch (error: any) {
    console.error('❌ Supabase connection failed:', error?.message || error);
    if (error?.message?.includes('fetch')) {
      console.error('   → Cannot reach Supabase API. Check your SUPABASE_URL');
    } else if (error?.message?.includes('Invalid API key')) {
      console.error('   → Invalid API key. Check your SUPABASE_ANON_KEY');
    }
  }

  console.log('\n');
  console.log('📋 Connection Summary:');
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}`);
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    console.log(`   Database Host: ${url.hostname}`);
    console.log(`   Database Port: ${url.port || '5432'}`);
    console.log(`   Database Name: ${url.pathname.replace('/', '') || 'postgres'}`);
  }
  console.log(`   SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Not set'}`);
  console.log(`   SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Not set'}`);
  console.log('\n');
}

// Run the test
testSupabaseConnection()
  .then(() => {
    console.log('✨ Connection test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Connection test failed:', error);
    process.exit(1);
  });
