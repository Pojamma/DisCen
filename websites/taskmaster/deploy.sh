#!/bin/bash
# Deploy Task Master to DisCen server

set -e

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
REMOTE_DIR="/home/opc/DisCen"
SSH_HOST="discen"

cd "$REPO_ROOT"

# Check for uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "Uncommitted changes detected. Commit before deploying."
    exit 1
fi

# Check for unpushed commits
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main 2>/dev/null || echo "")
if [ "$LOCAL" != "$REMOTE" ]; then
    echo "Pushing to GitHub..."
    git push
fi

# Deploy to server
echo "Deploying to $SSH_HOST..."
ssh "$SSH_HOST" "cd $REMOTE_DIR && git pull && sudo restorecon -Rv $REMOTE_DIR/websites/taskmaster && sudo systemctl reload nginx"

echo "Deploy complete."
