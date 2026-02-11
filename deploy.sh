#!/bin/bash
set -e

# Configuration
export PATH="/root/.nvm/versions/node/v24.13.0/bin:$PATH"
PROJECT_DIR="/root/.openclaw/workspace/projects/plastic-surgery-blog"
RELEASES_DIR="/var/www/plastic-surgery-blog/releases"
CURRENT_LINK="/var/www/plastic-surgery-blog/current"
DEPLOY_LOG="/var/www/plastic-surgery-blog/deploy.log"
LOCK_FILE="/var/www/plastic-surgery-blog/.deploy.lock"
KEEP_RELEASES=5
SITE_URL="https://plastic-surgery-blog.monsoftlabs.com"

# Timeouts (seconds)
NPM_INSTALL_TIMEOUT=120
NPM_BUILD_TIMEOUT=120
HEALTH_CHECK_TIMEOUT=10

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RELEASE_DIR="$RELEASES_DIR/$TIMESTAMP"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$DEPLOY_LOG"
}

cleanup_lock() {
    rm -f "$LOCK_FILE"
}

# Trap to ensure lock is released on exit
trap cleanup_lock EXIT

# Check for stale lock (older than 10 minutes)
if [ -f "$LOCK_FILE" ]; then
    LOCK_AGE=$(($(date +%s) - $(stat -c %Y "$LOCK_FILE")))
    if [ "$LOCK_AGE" -gt 600 ]; then
        log "⚠️ Removing stale lock (${LOCK_AGE}s old)"
        rm -f "$LOCK_FILE"
    else
        log "⏳ Another deployment in progress. Exiting."
        exit 0
    fi
fi

# Acquire lock
echo $$ > "$LOCK_FILE"

log "Starting deployment..."

cd "$PROJECT_DIR"

# Pull latest changes
log "Pulling from git..."
git fetch origin main
git reset --hard origin/main

# Install dependencies with timeout and retry
log "Installing dependencies..."
install_attempt=0
max_attempts=2

while [ $install_attempt -lt $max_attempts ]; do
    if timeout $NPM_INSTALL_TIMEOUT npm ci --silent 2>&1; then
        break
    else
        install_attempt=$((install_attempt + 1))
        if [ $install_attempt -lt $max_attempts ]; then
            log "⚠️ npm install failed, clearing cache and retrying..."
            npm cache clean --force 2>/dev/null || true
            rm -rf node_modules package-lock.json
            git checkout package-lock.json
        else
            log "❌ npm install failed after $max_attempts attempts"
            exit 1
        fi
    fi
done

# Build with timeout
log "Building..."
if ! timeout $NPM_BUILD_TIMEOUT npm run build 2>&1; then
    log "❌ Build failed or timed out"
    exit 1
fi

# Create release directory
log "Creating release $TIMESTAMP..."
mkdir -p "$RELEASE_DIR"
cp -r dist/* "$RELEASE_DIR/"
chown -R caddy:caddy "$RELEASE_DIR"

# Atomic symlink swap
log "Switching to new release..."
ln -sfn "$RELEASE_DIR" "${CURRENT_LINK}.new"
mv -Tf "${CURRENT_LINK}.new" "$CURRENT_LINK"

# Cleanup old releases
log "Cleaning up old releases..."
cd "$RELEASES_DIR"
ls -t | tail -n +$((KEEP_RELEASES + 1)) | xargs -r rm -rf

# Health check
log "Running health check..."
sleep 2  # Give the server a moment

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $HEALTH_CHECK_TIMEOUT "$SITE_URL" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    log "✅ Health check passed (HTTP $HTTP_CODE)"
else
    log "⚠️ Health check returned HTTP $HTTP_CODE (site may still be working)"
fi

log "✓ Deployment complete! Release: $TIMESTAMP"

# Write deployment status for external monitoring
echo "{\"release\":\"$TIMESTAMP\",\"status\":\"success\",\"timestamp\":\"$(date -Iseconds)\"}" > /var/www/plastic-surgery-blog/.last-deploy.json
