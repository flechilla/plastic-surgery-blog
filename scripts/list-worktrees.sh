#!/bin/bash
# List all Git worktrees with status
# Usage: ./scripts/list-worktrees.sh

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Git Worktrees${NC}"
echo "============="
echo ""

# Get worktree list
git worktree list --porcelain | while read -r line; do
  if [[ $line == worktree* ]]; then
    path="${line#worktree }"
    echo -e "${GREEN}📁 $path${NC}"
  elif [[ $line == HEAD* ]]; then
    head="${line#HEAD }"
    echo "   Commit: ${head:0:7}"
  elif [[ $line == branch* ]]; then
    branch="${line#branch refs/heads/}"
    echo "   Branch: $branch"
  elif [[ $line == "" ]]; then
    # Check for uncommitted changes
    if [ -d "$path" ]; then
      cd "$path" 2>/dev/null && {
        changes=$(git status --porcelain 2>/dev/null | wc -l)
        if [ "$changes" -gt 0 ]; then
          echo -e "   ${YELLOW}⚠️  $changes uncommitted changes${NC}"
        fi
        # Check how far ahead/behind
        ahead=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "?")
        behind=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo "?")
        if [ "$ahead" != "?" ] && [ "$behind" != "?" ]; then
          echo "   Ahead: $ahead, Behind: $behind"
        fi
      }
    fi
    echo ""
  fi
done

echo "Commands:"
echo "  Create:  ./scripts/new-worktree.sh <feature-name>"
echo "  Cleanup: ./scripts/cleanup-worktree.sh <feature-name>"
