#!/bin/bash
set -e

# Use full paths for Node/npm (nvm)
export PATH="/root/.nvm/versions/node/v24.13.0/bin:$PATH"

PROJECT_DIR="/root/.openclaw/workspace/projects/plastic-surgery-blog"
RELEASES_DIR="/var/www/plastic-surgery-blog/releases"
CURRENT_LINK="/var/www/plastic-surgery-blog/current"
DEPLOY_LOG="/var/www/plastic-surgery-blog/deploy.log"
KEEP_RELEASES=5

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RELEASE_DIR="$RELEASES_DIR/$TIMESTAMP"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$DEPLOY_LOG"
}

log "Starting deployment..."

cd "$PROJECT_DIR"
log "Pulling from git..."
git pull origin main

log "Installing dependencies..."
npm ci --silent

log "Building..."
npm run build

log "Creating release $TIMESTAMP..."
mkdir -p "$RELEASE_DIR"
cp -r dist/* "$RELEASE_DIR/"
chown -R caddy:caddy "$RELEASE_DIR"

log "Switching to new release..."
ln -sfn "$RELEASE_DIR" "${CURRENT_LINK}.new"
mv -Tf "${CURRENT_LINK}.new" "$CURRENT_LINK"

log "Cleaning up old releases..."
cd "$RELEASES_DIR"
ls -t | tail -n +$((KEEP_RELEASES + 1)) | xargs -r rm -rf

log "✓ Deployment complete! Release: $TIMESTAMP"
