#!/bin/bash

echo "🚀 Starting PIM Learning Platform Deployment..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js version: $(node --version)${NC}"

# Build Frontend
echo ""
echo -e "${YELLOW}📦 Building Frontend...${NC}"
cd client
if npm run build; then
    echo -e "${GREEN}✓ Frontend build successful${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi
cd ..

# Check if PM2 is installed
if command -v pm2 &> /dev/null; then
    echo ""
    echo -e "${YELLOW}🔄 Restarting Backend with PM2...${NC}"
    cd server
    pm2 restart pim-backend || pm2 start index.js --name "pim-backend"
    pm2 save
    cd ..
    echo -e "${GREEN}✓ Backend restarted${NC}"
else
    echo -e "${YELLOW}⚠️  PM2 not found. Please restart backend manually${NC}"
fi

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📋 Next steps:"
echo "  1. Check backend: pm2 logs pim-backend"
echo "  2. Test frontend: http://localhost:3000"
echo "  3. Test backend: http://localhost:5000"

