# Tool Blocks & Visualization

**Status:** Phase 2 (Planned)
**Related:** [conversation-ui.md](conversation-ui.md), [models.md](models.md)

## Overview

Tool blocks transform sequential tool invocations into meaningful visualizations that reveal the agent's problem-solving process. Rather than showing raw tool inputs/outputs, we group and visualize related operations.

---

## Core Concept

**Problem:** Agent sessions can involve 50+ tool uses. Showing each individually creates noise.

**Solution:** Group sequential related tools into semantic blocks:

```
❌ Flat list (noisy):
  - Grep: search for "auth"
  - Read: auth.ts
  - Read: middleware.ts
  - Edit: auth.ts
  - Edit: middleware.ts
  - Bash: npm test
  - Read: test output

✅ Grouped block (semantic):
  🔍 Search & Analysis Block (3 operations)
    ↳ Found auth in 2 files
  ✏️ File Changes Block (2 edits)
    ↳ Modified auth.ts, middleware.ts
  🧪 Test Run Block
    ↳ 12 passed, 0 failed
```

---

## Tool Block Types

### 1. Search Block

Groups: `Grep` → multiple `Read`

**Visualization:**

- Search query + file pattern
- Results heatmap (files by match count)
- Expandable file previews

```tsx
<SearchBlock>
  <Query>"auth" in *.ts (32 matches across 5 files)</Query>
  <Heatmap>[████████] auth.ts (18) [████ ] middleware.ts (8) [██ ] routes.ts (4)</Heatmap>
</SearchBlock>
```

### 2. File Changes Block

Groups: Sequential `Edit` or `Write` operations

**Visualization:**

- File tree with change indicators
- Unified diff view
- Lines added/removed summary

```tsx
<FileChangesBlock>
  <Summary>Modified 3 files (+42 -18)</Summary>
  <FileTree>
    ✏️ src/auth/ ├─ login.ts (+25 -8) └─ jwt.ts (+12 -5) ➕ src/middleware/ └─ auth-check.ts (new
    file, +5)
  </FileTree>
</FileChangesBlock>
```

### 3. Test Run Block

Groups: `Bash` test command → `Read` output

**Visualization:**

- Pass/fail matrix
- Coverage delta
- Failed test details on expand

```tsx
<TestRunBlock>
  <Matrix status="pass">✓ 12 passed | ✗ 0 failed | ⏭ 2 skipped</Matrix>
  <Coverage delta="+2.3%">Coverage: 87.5%</Coverage>
</TestRunBlock>
```

### 4. Git Operation Block

Groups: `Bash` git commands (add, commit, push)

**Visualization:**

- Commit message
- Changed files summary
- Branch/remote info

```tsx
<GitBlock>
  <Commit sha="a4f2e91">feat: add JWT authentication</Commit>
  <Changes>3 files changed, 42 insertions(+), 18 deletions(-)</Changes>
  <Branch>feature/auth → origin/feature/auth</Branch>
</GitBlock>
```

---

## Grouping Logic

### Sequential Tool Detection

```typescript
interface ToolBlock {
  type: 'search' | 'file-changes' | 'test-run' | 'git-operation';
  tool_use_ids: string[];
  summary: string;
  metadata: Record<string, unknown>;
}

function detectToolBlocks(toolUses: ToolUse[]): ToolBlock[] {
  const blocks: ToolBlock[] = [];
  let i = 0;

  while (i < toolUses.length) {
    // Search pattern: Grep → Read+
    if (toolUses[i].name === 'Grep') {
      const readTools = [];
      while (toolUses[i + 1]?.name === 'Read') {
        readTools.push(toolUses[i + 1]);
        i++;
      }
      blocks.push({
        type: 'search',
        tool_use_ids: [toolUses[i].id, ...readTools.map(t => t.id)],
        summary: `Searched "${toolUses[i].input.pattern}" in ${readTools.length} files`,
        metadata: { pattern: toolUses[i].input.pattern, fileCount: readTools.length },
      });
      i++;
      continue;
    }

    // File changes: Edit+ or Write+
    if (toolUses[i].name === 'Edit' || toolUses[i].name === 'Write') {
      const editTools = [toolUses[i]];
      while (toolUses[i + 1]?.name === 'Edit' || toolUses[i + 1]?.name === 'Write') {
        editTools.push(toolUses[i + 1]);
        i++;
      }
      blocks.push({
        type: 'file-changes',
        tool_use_ids: editTools.map(t => t.id),
        summary: `Modified ${editTools.length} files`,
        metadata: { files: editTools.map(t => t.input.file_path) },
      });
      i++;
      continue;
    }

    // Test run: Bash(test command) → Read?
    if (toolUses[i].name === 'Bash' && /test|jest|vitest|pytest/.test(toolUses[i].input.command)) {
      const testCommand = toolUses[i];
      const hasReadOutput = toolUses[i + 1]?.name === 'Read';
      blocks.push({
        type: 'test-run',
        tool_use_ids: hasReadOutput ? [testCommand.id, toolUses[i + 1].id] : [testCommand.id],
        summary: 'Ran tests',
        metadata: { command: testCommand.input.command },
      });
      i += hasReadOutput ? 2 : 1;
      continue;
    }

    // Git operation: Bash(git ...)
    if (toolUses[i].name === 'Bash' && /^git\s+(add|commit|push)/.test(toolUses[i].input.command)) {
      const gitTools = [toolUses[i]];
      while (toolUses[i + 1]?.name === 'Bash' && /^git\s+/.test(toolUses[i + 1].input.command)) {
        gitTools.push(toolUses[i + 1]);
        i++;
      }
      blocks.push({
        type: 'git-operation',
        tool_use_ids: gitTools.map(t => t.id),
        summary: 'Git operation',
        metadata: { commands: gitTools.map(t => t.input.command) },
      });
      i++;
      continue;
    }

    // Fallback: individual tool
    i++;
  }

  return blocks;
}
```

---

## Design Patterns

### Progressive Disclosure

1. **Default:** Block summary only
2. **One click:** Expand to show tool list
3. **Two clicks:** Show full tool input/output

### Visual Hierarchy

- Block headers with semantic icons (🔍 📝 🧪 📦)
- Color coding by block type
- Subtle borders, clear spacing

### Performance

- Lazy render expanded content
- Virtualize long tool lists
- Debounce collapse animations

---

## Implementation Notes

### Data Model Extensions

Add `tool_blocks` to Task:

```typescript
interface Task {
  // ... existing fields
  tool_blocks?: ToolBlock[];
}
```

### When to Compute Blocks

1. **Server-side (preferred):** During task completion
2. **Client-side (fallback):** On-demand in UI

### Agent Hints

Agents could annotate tool groups:

```typescript
// Assistant message metadata
{
  tool_grouping_hints: [{ block_type: 'search', tool_ids: ['tool_1', 'tool_2', 'tool_3'] }];
}
```

This reduces heuristic grouping errors.

---

## Future Extensions

### File Impact Graph

Visual diff of file relationships:

```
   auth.ts ─────┬──→ modified
                │
middleware.ts ──┴──→ calls auth.ts (modified)
                │
   routes.ts ───┘──→ imports middleware.ts
```

### Test Result Matrix

```
┌─────────────┬──────┬──────┬──────┐
│ Test Suite  │ Prev │ Now  │ Δ    │
├─────────────┼──────┼──────┼──────┤
│ Auth        │ ✓ 12 │ ✓ 14 │ +2   │
│ Middleware  │ ✓ 8  │ ✓ 8  │  0   │
│ Routes      │ ✗ 1  │ ✓ 5  │ +4✓  │
└─────────────┴──────┴──────┴──────┘
```

---

## References

- Implementation: `apps/agor-ui/src/components/ToolBlock/`
- [conversation-ui.md](conversation-ui.md) - Parent UI architecture
