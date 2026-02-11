#!/bin/bash
# Content Generator Cron Wrapper
# Runs the TypeScript content generator with proper environment

set -e

# Configuration
PROJECT_DIR="/root/.openclaw/workspace/projects/plastic-surgery-blog"
LOG_DIR="$PROJECT_DIR/logs"
LOG_FILE="$LOG_DIR/content-generator-$(date +%Y-%m-%d).log"
MAX_LOG_DAYS=7

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Clean old logs
find "$LOG_DIR" -name "content-generator-*.log" -mtime +$MAX_LOG_DAYS -delete

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use correct Node version
nvm use 24 2>/dev/null || true

# Load API keys from OpenClaw environment
if [ -f /root/.openclaw/.env ]; then
  export $(grep -E "^OPENAI_API_KEY=" /root/.openclaw/.env | xargs)
fi

# Load Crane bot token for notifications (sends to Crane channel, not main Vernis)
export CRANE_BOT_TOKEN=$(python3 -c "import json; print(json.load(open('/root/.openclaw/openclaw.json'))['channels']['telegram']['accounts']['crane']['botToken'])" 2>/dev/null)

# Note: Using GPT-4o for content generation (OpenAI API key)
# To use Claude instead, add a standard Anthropic API key (sk-ant-api03-...) to .env

# Run the generator
cd "$PROJECT_DIR"

echo "======================================" >> "$LOG_FILE"
echo "Content Generator Run: $(date)" >> "$LOG_FILE"
echo "======================================" >> "$LOG_FILE"

npx tsx scripts/content-generator.ts >> "$LOG_FILE" 2>&1

echo "" >> "$LOG_FILE"
echo "Completed: $(date)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
