# Git Worktree Workflow for Parallel Development

> Use Git Worktrees to work on multiple features simultaneously with Claude Code without conflicts.

## Overview

Git Worktree allows you to have multiple working directories from a single repository, each on a different branch. This enables:

- **Parallel development** — Multiple features at once
- **Isolation** — Each worktree has independent file state
- **No conflicts** — Claude Code instances don't interfere with each other
- **Main branch protection** — Develop on feature branches, merge when ready

---

## Directory Structure

```
~/projects/
├── plastic-surgery-blog/           # Main worktree (main branch)
│   ├── .git/                       # Actual Git repository
│   ├── src/
│   └── ...
│
└── plastic-surgery-blog-worktrees/ # Worktrees folder
    ├── feature-clinic-directory/   # Worktree for clinic feature
    ├── feature-search/             # Worktree for search feature
    └── feature-newsletter/         # Worktree for newsletter
```

**Key principle:** Worktrees live in a sibling folder, not inside the main project.

---

## Quick Reference

### Create a New Worktree

```bash
# From main project directory
cd /root/.openclaw/workspace/projects/plastic-surgery-blog

# Create branch and worktree in one command
git worktree add ../plastic-surgery-blog-worktrees/feature-NAME feature/NAME

# Or create branch first, then worktree
git branch feature/NAME
git worktree add ../plastic-surgery-blog-worktrees/feature-NAME feature/NAME
```

### List All Worktrees

```bash
git worktree list
```

### Remove a Worktree (after merging)

```bash
# Remove the worktree
git worktree remove ../plastic-surgery-blog-worktrees/feature-NAME

# Or manually delete and prune
rm -rf ../plastic-surgery-blog-worktrees/feature-NAME
git worktree prune

# Delete the branch if merged
git branch -d feature/NAME
```

### Switch to a Worktree

```bash
cd ../plastic-surgery-blog-worktrees/feature-NAME
```

---

## Complete Workflow

### 1. Starting a New Feature

```bash
# Navigate to main project
cd /root/.openclaw/workspace/projects/plastic-surgery-blog

# Ensure main is up to date
git checkout main
git pull origin main

# Create worktree for new feature
git worktree add ../plastic-surgery-blog-worktrees/feature-clinic-directory feature/clinic-directory

# Navigate to worktree
cd ../plastic-surgery-blog-worktrees/feature-clinic-directory

# Verify you're on the right branch
git branch
# * feature/clinic-directory

# Install dependencies (worktree shares .git but not node_modules)
npm install

# Start development
npm run dev
```

### 2. Working with Claude Code

```bash
# In the worktree directory
cd ../plastic-surgery-blog-worktrees/feature-clinic-directory

# Start Claude Code
claude

# Claude works on this feature branch independently
# Main branch remains untouched
```

### 3. Keeping Feature Branch Updated

```bash
# Periodically sync with main to avoid large merge conflicts
cd ../plastic-surgery-blog-worktrees/feature-clinic-directory

# Fetch latest changes
git fetch origin main

# Rebase onto main (preferred) or merge
git rebase origin/main
# OR
git merge origin/main

# Resolve any conflicts, then continue
npm install  # If package.json changed
```

### 4. Committing Work

```bash
# In the worktree
git add -A
git commit -m "feat(clinic-directory): add city page component"

# Push feature branch to remote
git push origin feature/clinic-directory
```

### 5. Creating a Pull Request

```bash
# Push your feature branch
git push origin feature/clinic-directory

# Create PR on GitHub (via CLI or web)
gh pr create --title "Add Clinic Directory Feature" --body "Description..."
```

### 6. Merging to Main

```bash
# Option A: Merge via GitHub PR (recommended)
# Review, approve, and merge on GitHub

# Option B: Manual merge
cd /root/.openclaw/workspace/projects/plastic-surgery-blog  # Main worktree
git checkout main
git pull origin main
git merge feature/clinic-directory
git push origin main
```

### 7. Cleanup After Merge

```bash
# Remove the worktree
git worktree remove ../plastic-surgery-blog-worktrees/feature-clinic-directory

# Delete the feature branch (if not done via PR)
git branch -d feature/clinic-directory
git push origin --delete feature/clinic-directory

# Prune any stale worktree references
git worktree prune
```

---

## Parallel Development Example

### Scenario: Three Features at Once

```bash
# Create three worktrees
git worktree add ../plastic-surgery-blog-worktrees/feature-clinic-directory feature/clinic-directory
git worktree add ../plastic-surgery-blog-worktrees/feature-search feature/search
git worktree add ../plastic-surgery-blog-worktrees/feature-newsletter feature/newsletter

# List all worktrees
git worktree list
# /root/.openclaw/workspace/projects/plastic-surgery-blog                          abc1234 [main]
# /root/.openclaw/workspace/projects/plastic-surgery-blog-worktrees/feature-clinic-directory  def5678 [feature/clinic-directory]
# /root/.openclaw/workspace/projects/plastic-surgery-blog-worktrees/feature-search            ghi9012 [feature/search]
# /root/.openclaw/workspace/projects/plastic-surgery-blog-worktrees/feature-newsletter        jkl3456 [feature/newsletter]
```

### Running Claude Code in Parallel

**Terminal 1:**
```bash
cd ../plastic-surgery-blog-worktrees/feature-clinic-directory
claude "Implement the clinic directory feature per docs/CLINIC-DIRECTORY-PLAN.md"
```

**Terminal 2:**
```bash
cd ../plastic-surgery-blog-worktrees/feature-search
claude "Add search functionality to the blog"
```

**Terminal 3:**
```bash
cd ../plastic-surgery-blog-worktrees/feature-newsletter
claude "Implement newsletter signup with email integration"
```

Each Claude instance works independently without conflicts!

---

## Best Practices

### ✅ DO

1. **Create worktrees in a sibling folder** — Not inside the main project
2. **Use descriptive branch names** — `feature/clinic-directory`, `fix/mobile-nav`
3. **Run `npm install` in each worktree** — node_modules isn't shared
4. **Commit frequently** — Small, atomic commits
5. **Sync with main regularly** — Rebase or merge to avoid large conflicts
6. **Clean up after merging** — Remove worktrees and branches
7. **Use PRs for merging** — Code review before main

### ❌ DON'T

1. **Don't create worktrees inside the project** — Causes Git confusion
2. **Don't work on the same files in multiple worktrees** — Causes merge conflicts
3. **Don't forget to push branches** — Worktrees are local only
4. **Don't leave stale worktrees** — Clutters disk and confuses Git
5. **Don't skip `npm install`** — Dependencies won't be available

---

## Handling Conflicts

### When Rebasing

```bash
# During rebase, if conflicts occur:
git status  # See conflicted files

# Edit files to resolve conflicts
# Remove conflict markers: <<<<<<<, =======, >>>>>>>

# Mark as resolved
git add <resolved-file>

# Continue rebase
git rebase --continue

# Or abort if needed
git rebase --abort
```

### Avoiding Conflicts

1. **Communicate** — Know what others are working on
2. **Small features** — Easier to merge
3. **Frequent syncs** — Don't diverge too far from main
4. **Separate concerns** — Different features touch different files
5. **Feature flags** — Incomplete features can be merged disabled

---

## Automation Scripts

### Create Worktree Script

Save as `scripts/new-worktree.sh`:

```bash
#!/bin/bash
# Usage: ./scripts/new-worktree.sh feature-name

FEATURE_NAME=$1
WORKTREES_DIR="../plastic-surgery-blog-worktrees"
PROJECT_DIR=$(pwd)

if [ -z "$FEATURE_NAME" ]; then
  echo "Usage: ./scripts/new-worktree.sh <feature-name>"
  exit 1
fi

# Ensure worktrees directory exists
mkdir -p "$WORKTREES_DIR"

# Create worktree
git worktree add "$WORKTREES_DIR/$FEATURE_NAME" "feature/$FEATURE_NAME" 2>/dev/null || \
git worktree add -b "feature/$FEATURE_NAME" "$WORKTREES_DIR/$FEATURE_NAME"

# Install dependencies
cd "$WORKTREES_DIR/$FEATURE_NAME"
npm install

echo ""
echo "✅ Worktree created: $WORKTREES_DIR/$FEATURE_NAME"
echo "   Branch: feature/$FEATURE_NAME"
echo ""
echo "To start working:"
echo "   cd $WORKTREES_DIR/$FEATURE_NAME"
echo "   claude"
```

### Cleanup Worktree Script

Save as `scripts/cleanup-worktree.sh`:

```bash
#!/bin/bash
# Usage: ./scripts/cleanup-worktree.sh feature-name

FEATURE_NAME=$1
WORKTREES_DIR="../plastic-surgery-blog-worktrees"

if [ -z "$FEATURE_NAME" ]; then
  echo "Usage: ./scripts/cleanup-worktree.sh <feature-name>"
  exit 1
fi

# Remove worktree
git worktree remove "$WORKTREES_DIR/$FEATURE_NAME" 2>/dev/null || \
(rm -rf "$WORKTREES_DIR/$FEATURE_NAME" && git worktree prune)

# Delete branch if merged
git branch -d "feature/$FEATURE_NAME" 2>/dev/null && \
echo "✅ Branch feature/$FEATURE_NAME deleted"

echo "✅ Worktree $FEATURE_NAME cleaned up"
```

---

## Tracking Active Work

Create a `WORKTREES.md` in main branch to track active features:

```markdown
# Active Worktrees

| Feature | Branch | Assignee | Status |
|---------|--------|----------|--------|
| Clinic Directory | feature/clinic-directory | Claude | In Progress |
| Search | feature/search | Claude | Not Started |
| Newsletter | feature/newsletter | - | Planned |

## Completed (Ready to Cleanup)
- feature/mobile-fix — Merged 2026-02-10
```

---

## Integration with OpenClaw/Crane

When using Crane (this agent) to create features:

1. **Request a worktree** — Ask Crane to create a worktree for the feature
2. **Work in isolation** — Crane works on the feature branch
3. **Review and merge** — Adriano reviews PR, merges to main
4. **Cleanup** — Crane removes worktree after merge

Example prompt:
> "Create a worktree for the clinic directory feature and start implementing it"

---

## Troubleshooting

### "fatal: 'feature/X' is already checked out"

A branch can only be checked out in one worktree at a time.

```bash
# Find where it's checked out
git worktree list

# Either remove that worktree or use a different branch name
```

### "node_modules not found" in worktree

```bash
# Each worktree needs its own node_modules
cd <worktree-path>
npm install
```

### Worktree references stale/deleted directory

```bash
git worktree prune
```

### Can't delete branch (not fully merged)

```bash
# Force delete (careful!)
git branch -D feature/feature-name

# Or merge first
git checkout main
git merge feature/feature-name
git branch -d feature/feature-name
```

---

## Summary

| Action | Command |
|--------|---------|
| Create worktree | `git worktree add ../worktrees/feature-X feature/X` |
| List worktrees | `git worktree list` |
| Remove worktree | `git worktree remove ../worktrees/feature-X` |
| Prune stale | `git worktree prune` |
| Sync with main | `git fetch origin main && git rebase origin/main` |

---

*Document created: 2026-02-11*
*Author: Crane (Development Agent)*
