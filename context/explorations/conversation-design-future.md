# Future Conversation Design Ideas

**Status:** Exploration / Future Work
**Created:** 2025-01-07
**Updated:** 2025-01-11

**Note:** Basic task-centric conversation UI is implemented (Phase 1). See [context/concepts/conversation-ui.md](../concepts/conversation-ui.md) for current implementation.

This document outlines advanced UI features for Phase 2+.

---

## Phase 2: Tool Blocks - Intelligent Tool Use Grouping

### Problem

Agents often execute bursts of tool calls in sequence:

- Read 5 files to understand context
- Edit 10 files to refactor
- Run tests, see failures, edit more files
- Search codebase for patterns

In a terminal, this is a wall of text. In Agor's current UI, each tool is shown individually. We can do better.

### Solution: Tool Block Component

When 3+ tool uses appear sequentially (no text messages between them), collapse them into a **Tool Block** with smart summarization.

#### Collapsed State: Visual Summary

```
┌─ Tool Block ─────────────────────────────────────────┐
│  🔧 12 tools executed                                 │
│                                                        │
│  📖 Read × 5    ✏️ Edit × 4    🔍 Grep × 2    ⚙️ Bash × 1   │
│                                                        │
│  📁 Modified files (4):                               │
│  • src/auth/jwt.ts                                    │
│  • src/auth/refresh.ts                                │
│  • src/middleware/auth.ts                             │
│  • tests/auth.test.ts                                 │
│                                                        │
│  [Show all tool details ▼]                            │
└────────────────────────────────────────────────────────┘
```

**Features:**

- Total tool count with grouped counts by tool type
- Visual tags with tool icons and counts
- Smart summaries:
  - File operations: Unique files affected
  - Searches: Number of matches found
  - Bash: Exit codes (✓ success, ✗ errors)
  - Tests: Pass/fail counts

#### Advanced Visualizations

**File Impact Graph:**

```
┌─ Files Modified ─────────────────────────────────┐
│  src/auth/                                        │
│    ├─ jwt.ts        [Edit × 3, Read × 1]         │
│    ├─ refresh.ts    [Edit × 2]                   │
│    └─ middleware/                                 │
│        └─ auth.ts   [Edit × 1, Read × 1]         │
│                                                   │
│  tests/                                           │
│    └─ auth.test.ts  [Edit × 1, Bash × 1]         │
└───────────────────────────────────────────────────┘
```

**Test Results Matrix:**

```
┌─ Test Run: npm test ─────────────────────────────┐
│  ✓ 24 passed    ✗ 2 failed    ⏭️ 1 skipped       │
│                                                   │
│  Failed tests:                                    │
│  • auth.test.ts: "should refresh expired token"  │
│  • auth.test.ts: "should reject invalid refresh" │
│                                                   │
│  [View full output ▼]                            │
└───────────────────────────────────────────────────┘
```

**Search Results Heatmap:**

```
┌─ Search: "refreshToken" ─────────────────────────┐
│  📊 Found in 8 files (23 matches):               │
│                                                   │
│  src/auth/jwt.ts           ████████ 8            │
│  src/auth/refresh.ts       ██████ 6              │
│  src/middleware/auth.ts    ███ 3                 │
│  tests/auth.test.ts        ████ 4                │
│                                                   │
│  [View all matches ▼]                            │
└───────────────────────────────────────────────────┘
```

### Implementation Strategy

```typescript
function groupMessagesIntoBlocks(messages: Message[]): Block[] {
  const blocks: Block[] = [];
  let toolBuffer: ToolUse[] = [];

  for (const msg of messages) {
    const hasToolUses = msg.tool_uses && msg.tool_uses.length > 0;
    const hasText = typeof msg.content === 'string' && msg.content.trim();

    if (hasToolUses && !hasText) {
      // Accumulate tool-only messages
      toolBuffer.push(...msg.tool_uses);
    } else {
      // Flush tool buffer if we have 3+ tools
      if (toolBuffer.length >= 3) {
        blocks.push({ type: 'tool-block', tools: toolBuffer });
        toolBuffer = [];
      } else if (toolBuffer.length > 0) {
        // Too few to group - render individually
        blocks.push(...toolBuffer.map(t => ({ type: 'tool-use', tool: t })));
        toolBuffer = [];
      }

      // Add current message
      if (hasText || hasToolUses) {
        blocks.push({ type: 'message', message: msg });
      }
    }
  }

  return blocks;
}
```

---

## Phase 3: LLM-Powered Session Enrichment

### Vision

Agor sessions are **living documents** that get richer over time through background LLM analysis jobs.

**Core Insight:** Run optional background LLM jobs to analyze completed sessions and progressively enhance the UI with:

- Summaries (task-level, session-level)
- Categorization (feature type, complexity level)
- Pattern detection (similar past work, reusable approaches)
- Knowledge extraction (concepts learned, decisions made)

**These enrichments are optional** - they appear in UI only when available.

### Enrichment Types

#### 1. Task Summaries

**Problem:** Task descriptions come from first 120 chars of user prompts. Not always helpful.

**Solution:** LLM generates concise summary.

```typescript
// Before enrichment
task.description = 'can you help me add auth to the ap...'; // Truncated

// After enrichment (stored in task.summary)
task.summary = 'Added JWT authentication with refresh tokens to API endpoints';
```

**UI Treatment:**

```tsx
<TaskHeader>
  {task.summary ? (
    <>
      <TaskTitle>{task.summary}</TaskTitle>
      <Tooltip title={task.full_prompt}>
        <Tag color="blue">✨ AI Summary</Tag>
      </Tooltip>
    </>
  ) : (
    <TaskTitle>{task.description}</TaskTitle>
  )}
</TaskHeader>
```

#### 2. Session Summaries

**Problem:** Hard to remember what a session accomplished.

**Solution:** Generate session-level summary from all tasks.

```typescript
session.summary = {
  overview: 'Implemented OAuth 2.0 authentication system with JWT tokens',
  key_changes: [
    'Added jwt.ts and refresh.ts authentication modules',
    'Created auth middleware for route protection',
    'Wrote comprehensive test suite (24 tests)',
  ],
  files_modified: 8,
  tests_added: 24,
  complexity: 'medium',
};
```

#### 3. Tool Block Summaries

**Problem:** Even collapsed tool blocks can be dense with 50+ tool uses.

**Solution:** LLM generates natural language summary.

```typescript
toolBlock.summary =
  'Refactored authentication logic across 8 files, focusing on JWT token validation and refresh handling. Added error handling for expired tokens.';
```

#### 4. Pattern & Concept Detection

**Solution:** LLM extracts reusable patterns and concepts.

```typescript
session.patterns = [
  {
    type: 'authentication',
    subtype: 'jwt',
    confidence: 0.95,
    description: 'JWT authentication with refresh tokens',
  },
];

session.concepts_mentioned = ['OAuth 2.0', 'JWT tokens', 'Refresh tokens', 'Middleware pattern'];
```

**UI Benefits:**

- Enable search by pattern type ("show me all JWT implementations")
- Show related sessions in sidebar
- Tag-based filtering and grouping

#### 5. Code Quality Insights

**Solution:** Analyze tool outputs and test results.

```typescript
session.quality_insights = {
  tests_status: 'all_passing',
  type_errors: 0,
  lint_warnings: 3,
  estimated_quality: 'high',
};
```

### Implementation: Background Jobs

```typescript
interface EnrichmentJob {
  job_id: string;
  type: 'task-summary' | 'session-summary' | 'tool-block-summary' | 'pattern-detection';
  target_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: number;
}

// Queue low-priority enrichment jobs on session completion
async function onSessionComplete(sessionId: string) {
  await queueJob({
    type: 'session-summary',
    target_id: sessionId,
    priority: 1,
  });
}
```

### Cost Management

**Using Haiku for cheap, fast enrichment:**

- Task summaries: ~$0.0001 per task
- Session summaries: ~$0.0005 per session
- Tool block summaries: ~$0.0002 per block

**For a 50-task session:**

- Total cost: ~$0.05
- Total time: ~10 seconds (parallel processing)

### UI Progressive Enhancement

**Never wait for enrichment. Show raw data immediately, enhance when available.**

```tsx
function TaskHeader({ task }: { task: Task }) {
  return (
    <div>
      <Text strong>{task.description}</Text>

      {task.summary && (
        <Tag color="blue" style={{ marginLeft: 8 }}>
          ✨ AI Summary
        </Tag>
      )}

      {task.enrichment_status === 'running' && <Spin size="small" style={{ marginLeft: 8 }} />}
    </div>
  );
}
```

---

## Phase 4: Extensibility - Plugin Architecture

### Tool-Specific Renderers

```typescript
interface MessageRenderer {
  name: string;
  match: (message: Message) => boolean;
  render: (message: Message) => ReactElement;
}

// Register tool-specific renderer
registerRenderer({
  name: 'cursor-diff',
  match: (msg) => msg.metadata?.tool === 'cursor' && msg.metadata?.diff,
  render: (msg) => <CursorDiffView diff={msg.metadata.diff} />
});
```

### Examples

**Cursor Inline Diff:**

```tsx
<CursorDiff
  file="src/app.ts"
  changes={message.metadata.changes}
  actions={
    <>
      <Button type="primary">Apply</Button>
      <Button>Reject</Button>
    </>
  }
/>
```

**Aider Git Commit:**

```tsx
<GitCommit
  sha={message.metadata.commit_sha}
  message={message.metadata.commit_message}
  files={message.metadata.changed_files}
  onView={() => showDiff(sha)}
/>
```

---

## Open Questions

1. **Tool Blocks:** Should grouping be configurable? (e.g., minimum 5 tools instead of 3?)
2. **Enrichment:** Should enrichment be local-only option? Cloud-based?
3. **Enrichment Accuracy:** How to handle incorrect LLM summaries? Allow manual override?
4. **File References:** Should we link to local files for "open in editor" functionality?
5. **Virtual Scrolling:** When should we enable it? (100+ messages? 1000+?)

---

## Related Documents

- [context/concepts/conversation-ui.md](../concepts/conversation-ui.md) - Current implementation
- [context/concepts/frontend-guidelines.md](../concepts/frontend-guidelines.md) - React patterns
- [context/explorations/async-jobs.md](async-jobs.md) - Background job processing

---

## References

- Ant Design X Components: `@ant-design/x`
- Current Implementation: `apps/agor-ui/src/components/ConversationView/`
