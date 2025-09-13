# Database Environment Setup Guide

## 🏗️ Architecture Overview

This project now uses **separate database environments** for development and production:

- **Local Development**: SQLite database (`dev.db`)
- **Production**: PostgreSQL on Prisma Cloud

## 📂 Files Structure

```
├── .env                          # Local development config (SQLite)
├── .env.production              # Production config (PostgreSQL)
├── prisma/
│   ├── schema.prisma            # Local development schema (SQLite)
│   ├── schema.production.prisma # Production schema (PostgreSQL)
│   └── seed.ts                  # Seed data for both environments
├── dev.db                       # Local SQLite database (auto-generated)
└── DATABASE_SETUP.md           # This guide
```

## 🚀 Development Workflow

### Local Development
```bash
# Start development server (uses SQLite)
npm run dev

# Reset local database
npm run db:reset

# View database in Prisma Studio
npm run db:studio

# Seed local database
npm run db:seed
```

### Production Deployment
```bash
# Deploy to production (uses PostgreSQL)
npm run deploy:production

# Or manual deployment
vercel --prod
```

## 🔧 Environment Variables

### Local (.env)
```bash
DATABASE_URL="file:./dev.db"
JWT_SECRET="nscoffee-local-dev-jwt-key"
NODE_ENV="development"
```

### Production (Vercel Environment Variables)
Set these in your Vercel dashboard:
```bash
DATABASE_URL="postgres://your-production-database-url"
JWT_SECRET="nscoffee-production-jwt-secret-2024"
NEXTAUTH_SECRET="nscoffee-production-nextauth-secret-2024"
NODE_ENV="production"
```

## 📋 Setup Checklist

- [x] Created separate database environments
- [x] Local SQLite database configured
- [x] Production PostgreSQL schema ready
- [x] Build scripts updated for production
- [x] Environment files properly configured
- [x] Local database seeded with test data

## 🔐 Test Credentials

After running `npm run db:seed`, you can login with:

- **Owner**: username `owner`, password `123456`
- **Staff 1**: username `staff1`, password `123456`
- **Staff 2**: username `staff2`, password `123456`

## ⚠️ Important Notes

1. **Never commit** `.env` or `.env.production` to git
2. **Always test locally** before deploying to production
3. **Production database** is shared with the live application
4. **Local database** (`dev.db`) is ignored by git

## 🚨 Troubleshooting

### If you see database connection errors:
1. Check which `.env` file is being loaded
2. Verify database URLs are correct
3. Ensure Prisma client is generated: `npx prisma generate`

### If local development uses production DB:
1. Check file precedence: `.env` vs `.env.local` vs `.env.production`
2. Delete `.env.production` if accidentally loaded
3. Restart development server

### If production deploy fails:
1. Verify Vercel environment variables are set
2. Check build logs for Prisma errors
3. Ensure production schema matches database