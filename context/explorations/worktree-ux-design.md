# Worktree Creation UX Design

## Current Implementation

The current UI has a confusing form with 3 fields:

1. **Worktree Name** - Descriptive name (e.g., "feature-x", "bugfix-123")
2. **Branch/Ref** - Branch or commit SHA to checkout
3. **Create as new branch** - Checkbox

**Problems:**

- Relationship between "name" and "ref" is unclear
- Common case (name = branch name) requires typing the same thing twice
- No guidance for remote branches
- Doesn't show what branches exist

## Common Use Cases

### Case 1: New Feature Branch (Most Common)

**Goal:** Create worktree + new branch with same name

**User Story:** "I want to work on `feature-auth`, create a new branch for it"

**Flow:**

- Worktree name: `feature-auth`
- Branch: `feature-auth` (same as worktree)
- Based on: `main` (or repo default branch)
- Action: Create new branch

### Case 2: Existing Remote Branch

**Goal:** Pull and checkout existing remote branch

**User Story:** "I want to work on `fix-api` which already exists on origin"

**Flow:**

- Worktree name: `fix-api`
- Branch: `fix-api` (same as worktree)
- Action: Checkout existing `origin/fix-api`

### Case 3: Different Worktree/Branch Names

**Goal:** Worktree name doesn't match branch name

**User Story:** "I want a worktree called `experiment-1` but work on branch `main`"

**Flow:**

- Worktree name: `experiment-1`
- Branch: `main` (different)
- Action: Checkout existing branch

### Case 4: Detached HEAD

**Goal:** Checkout specific commit SHA for investigation

**User Story:** "I want to check commit `abc123` for debugging"

**Flow:**

- Worktree name: `debug-abc123`
- Ref: `abc123` (SHA)
- Action: Checkout specific commit (detached HEAD)

## Proposed UX: Smart Defaults with Progressive Disclosure

### Form Fields

```
┌─ Create Worktree ─────────────────────────────────┐
│                                                    │
│  Worktree Name *                                   │
│  ┌──────────────────────────────────────────────┐ │
│  │ feature-auth                                  │ │
│  └──────────────────────────────────────────────┘ │
│  A descriptive name for this worktree             │
│                                                    │
│  ☑ Use same name for git branch                   │
│                                                    │
│  Branch Name                                       │
│  ┌──────────────────────────────────────────────┐ │
│  │ feature-auth              [disabled if ☑]     │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  Branch Strategy                                   │
│  ○ Create new branch from: [main ▾]               │
│  ○ Checkout existing branch                       │
│  ○ Checkout commit/tag (advanced)                 │
│                                                    │
│                              [Cancel]  [Create]   │
└────────────────────────────────────────────────────┘
```

### Smart Behavior

1. **Default:** "Use same name for git branch" is CHECKED
   - Branch name field is disabled and auto-filled
   - Most common case requires minimal input

2. **When unchecked:**
   - Branch name field becomes editable
   - User can specify different name

3. **Branch Strategy:**
   - **Create new branch from:** Dropdown shows existing branches (default: repo's default_branch)
   - **Checkout existing branch:** Shows autocomplete/dropdown of remote branches
   - **Checkout commit/tag:** Shows text input for SHA/tag (advanced)

4. **Auto-detection:**
   - If branch name matches remote branch → auto-select "Checkout existing branch"
   - Otherwise → default to "Create new branch"

### Implementation Changes

#### Backend API (No Changes Needed)

Current `createWorktree` is already flexible:

```typescript
async createWorktree(
  id: string,
  data: {
    name: string;      // Worktree name
    ref: string;       // Branch/commit/tag
    createBranch?: boolean;  // true = create new, false = checkout existing
  }
): Promise<Repo>
```

#### Frontend Changes

**Component:** `ReposTable.tsx` worktree modal

**State:**

```typescript
const [worktreeName, setWorktreeName] = useState('');
const [useSameName, setUseSameName] = useState(true);
const [branchName, setBranchName] = useState('');
const [strategy, setStrategy] = useState<'create' | 'checkout' | 'commit'>('create');
const [sourceBranch, setSourceBranch] = useState(repo.default_branch || 'main');
```

**Logic:**

```typescript
// Auto-sync branch name with worktree name if checkbox is checked
useEffect(() => {
  if (useSameName) {
    setBranchName(worktreeName);
  }
}, [worktreeName, useSameName]);

// Check if branch exists remotely when branch name changes
useEffect(() => {
  if (branchName && remoteBranches.includes(branchName)) {
    setStrategy('checkout'); // Auto-switch to checkout if branch exists
  }
}, [branchName]);

// On submit
const handleSubmit = () => {
  const data = {
    name: worktreeName,
    ref: strategy === 'create' ? branchName : strategy === 'checkout' ? branchName : commitRef,
    createBranch: strategy === 'create',
  };
  onCreateWorktree(repoId, data);
};
```

#### CLI Alignment

**Current:** No CLI command for worktree creation

**Proposed:** `agor repo worktree create <repo-slug> <name> [options]`

```bash
# Case 1: Create new branch (worktree name = branch name)
agor repo worktree create superset feature-auth

# Case 2: Create new branch with different name
agor repo worktree create superset my-experiment --branch feature-x

# Case 3: Checkout existing branch
agor repo worktree create superset fix-api --checkout

# Case 4: Checkout specific ref
agor repo worktree create superset debug-session --ref abc123def

# Case 5: Create branch from specific base
agor repo worktree create superset feature-y --from develop
```

**Flags:**

- `--branch <name>` - Specify different branch name (default: same as worktree name)
- `--checkout` - Checkout existing branch instead of creating new
- `--ref <sha>` - Checkout specific commit/tag
- `--from <branch>` - Base branch for new branch (default: repo's default branch)

## Migration Plan

### Phase 1: Improve UI (Immediate)

- Add "Use same name" checkbox
- Add branch strategy radio buttons
- Fetch remote branches for autocomplete
- Keep backend API unchanged

### Phase 2: Add CLI Command (Next)

- Implement `agor repo worktree create` with flags
- Align behavior with UI

### Phase 3: Advanced Features (Future)

- Auto-detect if remote branch exists and suggest checkout
- Show branch list in dropdown with descriptions
- Add "Fork from current branch" option
- Support pulling remote branch if it exists

## Additional Design Issues

### Issue 1: Slug Format Doesn't Support Slashes

**Problem:** Current slug validation only allows `[a-z0-9-]+`, but natural repo identifiers use org/repo format:

- `apache/superset` ❌ Current: superset ✅
- `facebook/react` ❌ Current: react ✅
- `vercel/next.js` ❌ Current: nextjs ✅

**Options:**

**Option A: Support slashes in slugs** (Recommended)

- Allow `[a-z0-9-/]+` pattern
- URL-safe when encoded: `apache%2Fsuperset`
- Natural identifier that matches GitHub/GitLab
- Example: `~/.agor/repos/apache/superset`

**Option B: Auto-generate slug from URL**

- Extract org/repo from URL automatically
- User can override if needed
- Example: `https://github.com/apache/superset.git` → slug: `apache/superset`

**Option C: Keep simple slugs, show full name separately**

- Slug: `superset` (required, must be unique)
- Display Name: `apache/superset` (optional, for UI only)
- Trade-off: Less intuitive but simpler storage

**Recommendation:** Option A + B (allow slashes, auto-extract from URL as default)

**Updated UI Flow:**

```
┌─ Clone Repository ────────────────────────────────┐
│                                                    │
│  Repository URL *                                  │
│  ┌──────────────────────────────────────────────┐ │
│  │ https://github.com/apache/superset.git       │ │
│  └──────────────────────────────────────────────┘ │
│  HTTPS or SSH URL                                  │
│                                                    │
│  Repository Slug *                                 │
│  ┌──────────────────────────────────────────────┐ │
│  │ apache/superset                               │ │
│  └──────────────────────────────────────────────┘ │
│  Auto-detected from URL (editable)                │
│  Allowed: lowercase letters, numbers, hyphens, /  │
│                                                    │
│                              [Cancel]  [Clone]    │
└────────────────────────────────────────────────────┘
```

**Slug Extraction Logic:**

```typescript
function extractSlugFromUrl(url: string): string {
  // Match GitHub/GitLab style URLs
  // https://github.com/apache/superset.git → apache/superset
  // git@github.com:facebook/react.git → facebook/react
  // https://gitlab.com/gitlab-org/gitlab.git → gitlab-org/gitlab

  const patterns = [
    /github\.com[:/]([^/]+\/[^/]+?)(\.git)?$/,
    /gitlab\.com[:/]([^/]+\/[^/]+?)(\.git)?$/,
    /bitbucket\.org[:/]([^/]+\/[^/]+?)(\.git)?$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1].toLowerCase().replace(/[^a-z0-9/-]/g, '-');
    }
  }

  // Fallback: just extract repo name
  return extractRepoName(url);
}
```

**Validation Updates:**

- Current: `/^[a-z0-9-]+$/`
- New: `/^[a-z0-9-/]+$/`
- Filesystem path: Replace `/` with platform-specific separator when needed

### Issue 2: Pull Latest Before Creating Worktree

**Problem:** When creating new branch from `main`, local `main` might be stale.

**Current Flow:**

```bash
git worktree add /path/to/worktree -b feature-x main
# Creates feature-x from whatever local main is (might be old!)
```

**Desired Flow:**

```bash
git fetch origin main           # Pull latest from remote
git worktree add /path/to/worktree -b feature-x origin/main  # Fork from remote
```

**Implementation:**

**Backend Changes:** Add `pullLatest` option to `createWorktree`:

```typescript
async createWorktree(
  id: string,
  data: {
    name: string;
    ref: string;
    createBranch?: boolean;
    pullLatest?: boolean;  // NEW: fetch remote before creating
  }
): Promise<Repo> {
  const repo = await this.get(id, params);

  // Pull latest if requested and ref is a branch name (not SHA)
  if (data.pullLatest && !data.ref.match(/^[0-9a-f]{7,40}$/)) {
    await git.fetch(['origin', data.ref]);
    // Use origin/ref as source instead of local ref
    const sourceRef = `origin/${data.ref}`;
    await gitCreateWorktree(repo.local_path, worktreePath, sourceRef, data.createBranch);
  } else {
    await gitCreateWorktree(repo.local_path, worktreePath, data.ref, data.createBranch);
  }
}
```

**UI Changes:**

```typescript
// Add checkbox: "Pull latest from remote" (checked by default when creating new branch)
const [pullLatest, setPullLatest] = useState(strategy === 'create');

// Auto-toggle based on strategy
useEffect(() => {
  if (strategy === 'create') {
    setPullLatest(true); // Default ON for new branches
  } else if (strategy === 'checkout') {
    setPullLatest(false); // Default OFF for existing branches
  }
}, [strategy]);
```

**CLI:**

```bash
# Default: pull latest when creating new branch
agor repo worktree create superset feature-x --from main
# → Fetches origin/main, creates feature-x from origin/main

# Opt-out: use local branch as-is
agor repo worktree create superset feature-x --from main --no-pull

# Explicit pull for checkout existing
agor repo worktree create superset feature-x --checkout --pull
```

### Issue 3: Smart Source Branch Selection

**Current:** User must manually select source branch (main, develop, etc.)

**Proposal:** Auto-select based on repo metadata

1. Use `repo.default_branch` (fetched during clone)
2. Show as default but allow override
3. Common options: main, master, develop, staging

**UI:**

```
Create new branch from: [main ▾] ☑ Pull latest from remote
                        └─ main (default)
                           master
                           develop
                           staging
```

## Questions for User

1. **Slug format:** Allow slashes (`apache/superset`) or keep simple (`superset`)?

2. **Auto-extract slug:** Should we parse org/repo from GitHub URL and suggest as slug?

3. **Pull latest:** Should this be DEFAULT ON when creating new branches?

4. **CLI priority:** Implement CLI command now or later?

5. **Remote branch detection:** Auto-detect if branch exists remotely and suggest checkout mode?

## Technical Debt

### Avoid Direct Subprocess Usage

**Location:** `packages/core/src/tools/claude/prompt-service.ts:8`

**Current Code:**

```typescript
import { execSync } from 'node:child_process';

function getClaudeCodePath(): string {
  try {
    const path = execSync('which claude', { encoding: 'utf-8' }).trim();
    if (path) return path;
  } catch {
    // Fallback to common paths
  }
  // ...
}
```

**Issue:** Direct use of `execSync` is discouraged. While it's acceptable for libraries (like `simple-git`) to use subprocess internally, we should avoid it in our application code.

**Solution Options:**

1. **Use fs-based detection only:**

   ```typescript
   function getClaudeCodePath(): string {
     const commonPaths = [
       '/usr/local/bin/claude',
       '/opt/homebrew/bin/claude',
       `${process.env.HOME}/.nvm/versions/node/v20.19.4/bin/claude`,
     ];

     for (const path of commonPaths) {
       if (existsSync(path) && statSync(path).mode & 0o111) {
         return path;
       }
     }

     throw new Error('Claude Code executable not found in common paths');
   }
   ```

2. **Check PATH environment variable manually:**

   ```typescript
   function getClaudeCodePath(): string {
     const paths = process.env.PATH?.split(':') || [];
     for (const dir of paths) {
       const claudePath = join(dir, 'claude');
       if (existsSync(claudePath) && statSync(claudePath).mode & 0o111) {
         return claudePath;
       }
     }
     // Fallback to common paths
   }
   ```

3. **Let Agent SDK handle it:**
   Wait for Agent SDK to expose a `findClaudeExecutable()` utility function

**Recommendation:** Option 2 (manual PATH check) + Option 1 (common paths fallback)

**Priority:** Low (works fine now, but should fix before expanding usage)
