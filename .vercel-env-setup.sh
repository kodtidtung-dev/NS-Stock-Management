#!/bin/bash
# Script to update Vercel environment variables

echo "Setting up Vercel environment variables..."

# Instructions for manual setup
cat << 'EOF'

=======================================================
VERCEL ENVIRONMENT VARIABLES SETUP
=======================================================

Please update the following environment variables in Vercel Dashboard:

1. DATABASE_URL (Production):
postgres://1baaa6389be177594aab2286a0130acc5d65a55dcb9732fffc8b026f95cfee68:sk_wL1f4EQ4PMgB2Mo96Jww2@db.prisma.io:5432/postgres?sslmode=require&connection_limit=10&pool_timeout=10

2. JWT_SECRET (Production):
nscoffee-production-jwt-secret-2024

3. NEXTAUTH_SECRET (Production):
nscoffee-production-nextauth-secret-2024

=======================================================
Steps:
1. Go to: https://vercel.com/dashboard
2. Select: ns-stock-management
3. Settings → Environment Variables
4. Delete old DATABASE_URL
5. Add new DATABASE_URL with connection pooling params
6. Redeploy
=======================================================

EOF
