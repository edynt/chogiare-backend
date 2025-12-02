# Deployment Guide - Chogiare Backend

## 1. Prerequisites

### 1.1. Required Tools
- Node.js 20.x or higher
- npm or yarn
- Docker & Docker Compose (for containerized deployment)
- PostgreSQL (Supabase) - Database
- Redis - Cache & Queue
- Supabase Account - Storage & Auth (optional)

### 1.2. Environment Variables
Create `.env` file based on `.env.example`:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD="your-redis-password"

# JWT
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="1h"
REFRESH_TOKEN_SECRET="your-refresh-token-secret"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Supabase
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_KEY="your-supabase-service-key"

# Application
NODE_ENV="production"
PORT=3000
API_PREFIX="api"

# Payment Gateways (optional)
MOMO_PARTNER_CODE=""
MOMO_ACCESS_KEY=""
MOMO_SECRET_KEY=""

ZALOPAY_APP_ID=""
ZALOPAY_KEY1=""
ZALOPAY_KEY2=""

STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""

# Email (optional)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASSWORD=""
```

## 2. Local Development Setup

### 2.1. Install Dependencies
```bash
npm install
```

### 2.2. Setup Database
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

### 2.3. Start Development Server
```bash
# Using npm
npm run start:dev

# Using Docker Compose
docker-compose -f docker-compose.dev.yml up
```

## 3. Production Deployment

### 3.1. Build Application
```bash
# Build
npm run build

# Or using Docker
docker build -t chogiare-backend:latest .
```

### 3.2. Database Migration
```bash
# Run migrations in production
npx prisma migrate deploy

# Or using Docker
docker run --rm \
  -e DATABASE_URL="$DATABASE_URL" \
  chogiare-backend:latest \
  npx prisma migrate deploy
```

### 3.3. Start Application

#### Option 1: Docker Compose
```bash
docker-compose up -d
```

#### Option 2: Docker Run
```bash
docker run -d \
  --name chogiare-backend \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  chogiare-backend:latest
```

#### Option 3: PM2 (Node.js process manager)
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/main.js --name chogiare-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## 4. Supabase Setup

### 4.1. Create Supabase Project
1. Go to https://supabase.com
2. Create new project
3. Get connection string from Settings > Database
4. Get API keys from Settings > API

### 4.2. Configure Prisma
Update `DATABASE_URL` in `.env` with Supabase connection string:
```
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

### 4.3. Run Migrations
```bash
npx prisma migrate deploy
```

### 4.4. Setup Storage Buckets
1. Go to Storage in Supabase dashboard
2. Create buckets:
   - `products` - Product images
   - `stores` - Store logos/banners
   - `avatars` - User avatars
   - `documents` - Other files

## 5. Redis Setup

### 5.1. Local Redis
```bash
# Using Docker
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine \
  redis-server --requirepass your-password
```

### 5.2. Cloud Redis (Recommended for Production)
- **Upstash Redis**: https://upstash.com
- **Redis Cloud**: https://redis.com/cloud
- **AWS ElastiCache**: For AWS deployments

Update `REDIS_URL` in `.env`:
```
REDIS_URL="redis://default:password@host:port"
```

## 6. CI/CD Pipeline

### 6.1. GitHub Actions Example
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/to/app
            git pull
            npm ci --production
            npx prisma migrate deploy
            pm2 restart chogiare-backend
```

## 7. Monitoring & Logging

### 7.1. Application Logs
- Logs stored in `./logs` directory
- Use structured logging (JSON format)
- Rotate logs daily

### 7.2. Health Check Endpoint
```bash
curl http://localhost:3000/health
```

### 7.3. Monitoring Tools
- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **Sentry**: Error tracking (optional)
- **Loki**: Log aggregation (optional)

## 8. Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS (use reverse proxy like Nginx)
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable firewall rules
- [ ] Use environment variables for secrets
- [ ] Regular security updates
- [ ] Database backups
- [ ] SSL/TLS certificates

## 9. Performance Optimization

### 9.1. Database
- [ ] Add indexes for frequently queried fields
- [ ] Use connection pooling
- [ ] Enable query caching
- [ ] Monitor slow queries

### 9.2. Application
- [ ] Enable gzip compression
- [ ] Use CDN for static assets
- [ ] Implement caching strategy
- [ ] Optimize images
- [ ] Use pagination for large datasets

### 9.3. Infrastructure
- [ ] Use load balancer
- [ ] Enable auto-scaling
- [ ] Database read replicas
- [ ] Redis cluster for high availability

## 10. Backup Strategy

### 10.1. Database Backup
```bash
# Daily backup script
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20240101.sql
```

### 10.2. Automated Backups
- Use Supabase automated backups (if using Supabase)
- Or setup cron job for daily backups
- Store backups in S3 or similar

## 11. Scaling

### 11.1. Horizontal Scaling
- Run multiple application instances
- Use load balancer (Nginx, HAProxy)
- Session stored in Redis (stateless)

### 11.2. Database Scaling
- Use read replicas for read operations
- Connection pooling (PgBouncer)
- Database sharding (if needed)

### 11.3. Cache Scaling
- Redis cluster mode
- Cache warming strategies
- Cache invalidation policies

## 12. Troubleshooting

### 12.1. Application Won't Start
- Check environment variables
- Verify database connection
- Check Redis connection
- Review application logs

### 12.2. Database Connection Issues
- Verify DATABASE_URL
- Check network connectivity
- Verify database credentials
- Check firewall rules

### 12.3. Performance Issues
- Check database query performance
- Monitor Redis usage
- Review application logs
- Check server resources (CPU, memory)

## 13. Rollback Procedure

### 13.1. Application Rollback
```bash
# Using PM2
pm2 restart chogiare-backend --update-env

# Using Docker
docker-compose down
docker-compose up -d --scale app=1
```

### 13.2. Database Rollback
```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back <migration-name>

# Or restore from backup
psql $DATABASE_URL < backup.sql
```

## 14. Maintenance

### 14.1. Regular Tasks
- [ ] Update dependencies monthly
- [ ] Review and optimize database queries
- [ ] Clean up old logs
- [ ] Review security patches
- [ ] Monitor error rates
- [ ] Review performance metrics

### 14.2. Database Maintenance
```bash
# Analyze tables
npx prisma db execute --stdin <<< "ANALYZE;"

# Vacuum database
npx prisma db execute --stdin <<< "VACUUM ANALYZE;"
```

## 15. Support & Resources

- **Documentation**: See `docs/` folder
- **API Documentation**: `/api/docs` (Swagger)
- **Health Check**: `/health`
- **Logs**: `./logs/` directory

## 16. Production Checklist

Before going to production:

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Redis configured and tested
- [ ] Supabase storage buckets created
- [ ] SSL/TLS certificates installed
- [ ] Monitoring setup
- [ ] Backup strategy in place
- [ ] Security measures implemented
- [ ] Load testing completed
- [ ] Documentation updated
- [ ] Team trained on deployment process


