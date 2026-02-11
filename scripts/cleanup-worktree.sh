#!/bin/bash
# Remove a Git worktree after feature is merged
# Usage: ./scripts/cleanup-worktree.sh <feature-name>
#
# Example: ./scripts/cleanup-worktree.sh clinic-directory
# Removes: ../plastic-surgery-blog-worktrees/clinic-directory
# Deletes: feature/clinic-directory branch (if merged)

set -e

FEATURE_NAME=$1
PROJECT_NAME="plastic-surgery-blog"
WORKTREES_DIR="../${PROJECT_NAME}-worktrees"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

if [ -z "$FEATURE_NAME" ]; then
  echo -e "${RED}Error: Feature name required${NC}"
  echo ""
  echo "Usage: ./scripts/cleanup-worktree.sh <feature-name>"
  echo ""
  echo "Active worktrees:"
  git worktree list
  exit 1
fi

BRANCH_NAME="feature/$FEATURE_NAME"
WORKTREE_PATH="$WORKTREES_DIR/$FEATURE_NAME"

echo -e "${BLUE}Cleaning up worktree: $FEATURE_NAME${NC}"
echo ""

# Ensure we're in a git repository
if [ ! -d ".git" ]; then
  echo -e "${RED}Error: Not in a Git repository root${NC}"
  exit 1
fi

# Check if worktree exists
if [ ! -d "$WORKTREE_PATH" ]; then
  echo -e "${YELLOW}Warning: Worktree directory not found at $WORKTREE_PATH${NC}"
  echo "Pruning stale references..."
  git worktree prune
else
  # Remove the worktree
  echo "🗑️  Removing worktree..."
  git worktree remove "$WORKTREE_PATH" --force 2>/dev/null || {
    echo "Force removing directory..."
    rm -rf "$WORKTREE_PATH"
    git worktree prune
  }
  echo -e "${GREEN}✓ Worktree removed${NC}"
fi

# Try to delete the branch
echo ""
echo "🌿 Attempting to delete branch $BRANCH_NAME..."

if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
  # Check if branch is merged
  if git branch --merged main | grep -q "$BRANCH_NAME"; then
    git branch -d "$BRANCH_NAME"
    echo -e "${GREEN}✓ Branch deleted (was merged to main)${NC}"
  else
    echo -e "${YELLOW}⚠️  Branch not merged to main${NC}"
    read -p "Force delete unmerged branch? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      git branch -D "$BRANCH_NAME"
      echo -e "${GREEN}✓ Branch force deleted${NC}"
    else
      echo "Branch kept: $BRANCH_NAME"
    fi
  fi
else
  echo "Branch $BRANCH_NAME not found locally (may already be deleted)"
fi

# Delete remote branch if it exists
echo ""
echo "🌐 Checking remote branch..."
if git ls-remote --heads origin "$BRANCH_NAME" | grep -q "$BRANCH_NAME"; then
  read -p "Delete remote branch origin/$BRANCH_NAME? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin --delete "$BRANCH_NAME" 2>/dev/null || echo "Could not delete remote branch"
    echo -e "${GREEN}✓ Remote branch deleted${NC}"
  fi
else
  echo "No remote branch found"
fi

echo ""
echo -e "${GREEN}✅ Cleanup complete!${NC}"
echo ""
echo "Current worktrees:"
git worktree list
