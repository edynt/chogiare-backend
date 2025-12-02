#!/usr/bin/env node

/**
 * Script to generate .env file
 * Usage: node scripts/generate-env.js
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
const envExamplePath = path.join(__dirname, '../.env.example');

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists!');
  console.log('   If you want to regenerate, delete .env first.');
  process.exit(0);
}

const envContent = `# ============================================
# DATABASE - SUPABASE POSTGRESQL
# ============================================
# Supabase Local với port 5433
# Format: postgresql://[user]:[password]@[host]:[port]/[database]?[params]
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/postgres?schema=public"
DATABASE_SSL="false"

# Connection Pool Settings
DATABASE_POOL_MIN="2"
DATABASE_POOL_MAX="10"
DATABASE_POOL_IDLE_TIMEOUT="30000"

# ============================================
# REDIS (Cache & Queue)
# ============================================
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=""

# ============================================
# JWT AUTHENTICATION
# ============================================
# ⚠️  THAY ĐỔI CÁC SECRET NÀY TRONG PRODUCTION!
JWT_SECRET="chogiare-dev-jwt-secret-key-change-in-production-2024"
JWT_EXPIRES_IN="1h"
REFRESH_TOKEN_SECRET="chogiare-dev-refresh-token-secret-key-change-in-production-2024"
REFRESH_TOKEN_EXPIRES_IN="7d"

# ============================================
# SUPABASE API (Optional - cho Storage/Auth)
# ============================================
# Lấy từ Supabase Dashboard > Settings > API
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_KEY="your-supabase-service-key"

# ============================================
# APPLICATION CONFIGURATION
# ============================================
NODE_ENV="development"
PORT=3000
API_PREFIX="api"
CORS_ORIGIN="*"
APP_NAME="Chogiare Backend"

# ============================================
# PAYMENT GATEWAYS (Optional)
# ============================================
# MoMo Payment
MOMO_PARTNER_CODE=""
MOMO_ACCESS_KEY=""
MOMO_SECRET_KEY=""

# ZaloPay Payment
ZALOPAY_APP_ID=""
ZALOPAY_KEY1=""
ZALOPAY_KEY2=""

# Stripe Payment
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""

# PayPal Payment
PAYPAL_CLIENT_ID=""
PAYPAL_CLIENT_SECRET=""
PAYPAL_MODE="sandbox"

# ============================================
# EMAIL CONFIGURATION (Optional)
# ============================================
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM_EMAIL="noreply@chogiare.com"
SMTP_FROM_NAME="Chogiare"

# ============================================
# FILE UPLOAD (Optional)
# ============================================
MAX_FILE_SIZE="10485760"
MAX_FILES_PER_UPLOAD="10"
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/gif,image/webp,application/pdf"

# ============================================
# RATE LIMITING (Optional)
# ============================================
RATE_LIMIT_TTL="60"
RATE_LIMIT_MAX="100"

# ============================================
# LOGGING (Optional)
# ============================================
LOG_LEVEL="debug"
LOG_FILE_PATH="./logs"
LOG_MAX_SIZE="10m"
LOG_MAX_FILES="14d"
`;

// Write .env file
fs.writeFileSync(envPath, envContent, 'utf8');
console.log('✅ .env file created successfully!');
console.log('');
console.log('📝 Next steps:');
console.log('   1. Review and update DATABASE_URL if needed');
console.log('   2. Update JWT_SECRET and REFRESH_TOKEN_SECRET for production');
console.log('   3. Configure Supabase credentials if using Supabase features');
console.log('   4. Run: npm run test:db (to test database connection)');
console.log('');

