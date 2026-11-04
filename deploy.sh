#!/bin/bash
# deploy.sh — Push local changes and deploy to DisCen server
# Usage: ./deploy.sh [commit message]

set -e

SERVER="discen"
REMOTE_DIR="/home/opc/DisCen"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

step() { echo -e "\n${GREEN}▶ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
fail() { echo -e "${RED}✖ $1${NC}"; exit 1; }

# 1. Check for uncommitted changes
step "Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    git status --short
    echo ""
    if [ -n "$1" ]; then
        MSG="$*"
    else
        read -rp "Commit message: " MSG
        [ -z "$MSG" ] && fail "No commit message provided"
    fi
    step "Committing changes..."
    git add -A
    git commit -m "$MSG"
else
    echo "Working tree clean."
fi

# 2. Push to GitHub
step "Pushing to GitHub..."
git push origin main

# 3. Pull on server
step "Pulling on server..."
ssh "$SERVER" "cd $REMOTE_DIR && git pull"

# 4. Install dependencies if package.json changed
step "Checking dependencies..."
CHANGED=$(ssh "$SERVER" "cd $REMOTE_DIR && git diff HEAD~1 --name-only 2>/dev/null | grep -c package.json || true")
if [ "$CHANGED" -gt 0 ]; then
    echo "package.json changed — running npm install..."
    ssh "$SERVER" "cd $REMOTE_DIR && npm install --production"
else
    echo "No dependency changes."
fi

# 5. Fix SELinux contexts for any new files
step "Fixing SELinux contexts..."
ssh "$SERVER" "sudo restorecon -Rv $REMOTE_DIR/websites/ $REMOTE_DIR/src/ 2>&1 | grep -v 'No change' || true"

# 6. Check if nginx config changed
step "Checking nginx config..."
NGINX_CHANGED=$(ssh "$SERVER" "cd $REMOTE_DIR && git diff HEAD~1 --name-only 2>/dev/null | grep -c discen.conf || true")
if [ "$NGINX_CHANGED" -gt 0 ]; then
    echo "discen.conf changed — updating nginx..."
    ssh "$SERVER" "sudo cp $REMOTE_DIR/discen.conf /etc/nginx/conf.d/discen.conf && sudo nginx -t && sudo systemctl reload nginx"
    echo "Nginx reloaded."
else
    echo "No nginx config changes."
fi

# 7. Restart Node.js service
step "Restarting discen service..."
ssh "$SERVER" "sudo systemctl restart discen"

# 8. Verify
step "Verifying deployment..."
sleep 1
HEALTH=$(ssh "$SERVER" "curl -sf http://localhost:3001/health" 2>/dev/null)
if echo "$HEALTH" | grep -q '"OK"'; then
    echo -e "${GREEN}✔ Health check passed${NC}"
else
    warn "Health check failed — check server logs: ssh discen 'journalctl -u discen -n 20'"
fi

COMMIT=$(git log --oneline -1)
echo -e "\n${GREEN}✔ Deployed: ${COMMIT}${NC}"
