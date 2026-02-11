#!/bin/bash
# Create a new Git worktree for feature development
# Usage: ./scripts/new-worktree.sh <feature-name>
#
# Example: ./scripts/new-worktree.sh clinic-directory
# Creates: ../plastic-surgery-blog-worktrees/clinic-directory
# Branch:  feature/clinic-directory

set -e

FEATURE_NAME=$1
PROJECT_NAME="plastic-surgery-blog"
WORKTREES_DIR="../${PROJECT_NAME}-worktrees"
PROJECT_DIR=$(pwd)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

if [ -z "$FEATURE_NAME" ]; then
  echo -e "${RED}Error: Feature name required${NC}"
  echo ""
  echo "Usage: ./scripts/new-worktree.sh <feature-name>"
  echo ""
  echo "Examples:"
  echo "  ./scripts/new-worktree.sh clinic-directory"
  echo "  ./scripts/new-worktree.sh search-feature"
  echo "  ./scripts/new-worktree.sh mobile-fix"
  exit 1
fi

BRANCH_NAME="feature/$FEATURE_NAME"
WORKTREE_PATH="$WORKTREES_DIR/$FEATURE_NAME"

echo -e "${BLUE}Creating worktree for: $FEATURE_NAME${NC}"
echo ""

# Ensure we're in a git repository
if [ ! -d ".git" ]; then
  echo -e "${RED}Error: Not in a Git repository root${NC}"
  exit 1
fi

# Ensure main is up to date
echo "📥 Fetching latest from origin..."
git fetch origin main

# Ensure worktrees directory exists
mkdir -p "$WORKTREES_DIR"

# Check if worktree already exists
if [ -d "$WORKTREE_PATH" ]; then
  echo -e "${RED}Error: Worktree already exists at $WORKTREE_PATH${NC}"
  echo "To remove it: git worktree remove $WORKTREE_PATH"
  exit 1
fi

# Check if branch already exists
if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
  echo "📌 Branch $BRANCH_NAME already exists, using it..."
  git worktree add "$WORKTREE_PATH" "$BRANCH_NAME"
else
  echo "🌿 Creating new branch $BRANCH_NAME from main..."
  git worktree add -b "$BRANCH_NAME" "$WORKTREE_PATH" origin/main
fi

# Install dependencies in the new worktree
echo ""
echo "📦 Installing dependencies..."
cd "$WORKTREE_PATH"
npm install --silent

# Copy any local environment files if they exist
if [ -f "$PROJECT_DIR/.env.local" ]; then
  cp "$PROJECT_DIR/.env.local" "$WORKTREE_PATH/.env.local"
  echo "📋 Copied .env.local"
fi

echo ""
echo -e "${GREEN}✅ Worktree created successfully!${NC}"
echo ""
echo "📁 Location: $WORKTREE_PATH"
echo "🌿 Branch:   $BRANCH_NAME"
echo ""
echo "To start working:"
echo -e "  ${BLUE}cd $WORKTREE_PATH${NC}"
echo -e "  ${BLUE}npm run dev${NC}"
echo ""
echo "To use with Claude Code:"
echo -e "  ${BLUE}cd $WORKTREE_PATH && claude${NC}"
echo ""
echo "When done, merge via PR and cleanup:"
echo -e "  ${BLUE}./scripts/cleanup-worktree.sh $FEATURE_NAME${NC}"
