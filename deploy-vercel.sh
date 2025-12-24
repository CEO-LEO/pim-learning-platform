#!/bin/bash

echo "🚀 PIM Learning Platform - Vercel Deployment"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

echo -e "${GREEN}✓ Vercel CLI ready${NC}"
echo ""

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}Please login to Vercel:${NC}"
    vercel login
fi

echo ""
echo -e "${BLUE}📋 Step 1: Deploy Backend (Railway/Render)${NC}"
echo -e "${YELLOW}Please deploy backend first:${NC}"
echo "  1. Go to https://railway.app or https://render.com"
echo "  2. Create new project"
echo "  3. Deploy from GitHub"
echo "  4. Set Root Directory: server"
echo "  5. Set Environment Variables"
echo ""
read -p "Enter your Backend URL (e.g., https://xxx.railway.app): " BACKEND_URL

if [ -z "$BACKEND_URL" ]; then
    echo -e "${RED}❌ Backend URL is required${NC}"
    exit 1
fi

# Remove trailing slash
BACKEND_URL=${BACKEND_URL%/}
API_URL="${BACKEND_URL}/api"

echo ""
echo -e "${BLUE}📋 Step 2: Deploy Frontend (Vercel)${NC}"
echo ""

# Go to client directory
cd client

# Set environment variable
export REACT_APP_API_URL=$API_URL

echo -e "${YELLOW}Building React app...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Build successful${NC}"
echo ""

# Deploy to Vercel
echo -e "${YELLOW}Deploying to Vercel...${NC}"
vercel --prod --env REACT_APP_API_URL=$API_URL

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Set REACT_APP_API_URL in Vercel Dashboard: $API_URL"
    echo "  2. Update CORS in backend to allow Vercel domain"
    echo "  3. Test your application"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

