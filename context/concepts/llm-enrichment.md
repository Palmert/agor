# LLM-Powered Conversation Enrichment

**Status:** Phase 3 (Planned)
**Related:** [conversation-ui.md](conversation-ui.md), [models.md](models.md)

## Overview

Agor uses LLMs to analyze completed agent sessions and generate high-level insights that humans can't easily extract from raw transcripts. This moves beyond simple statistics to semantic understanding.

---

## Core Insight

**Raw data is cheap; synthesis is valuable.**

A 2-hour Claude session might have:

- 150 messages
- 80 tool uses
- 15 files modified
- 12 test runs

Humans need: **"What was accomplished? What patterns emerged? What should I know?"**

---

## Enrichment Types

### 1. Task Summaries

**Input:** Task message range (user prompt → completion)

**Output:** Concise description of what was accomplished

```typescript
interface TaskSummary {
  task_id: TaskID;
  generated_summary: string; // 1-2 sentences
  key_changes: string[]; // Bullet points
  complexity: 'trivial' | 'moderate' | 'complex';
  estimated_tokens: number;
}
```

**Example:**

```markdown
**Original prompt:** "Add JWT authentication to the login endpoint"

**Generated summary:**
Implemented JWT-based authentication with token generation, middleware validation, and refresh token flow. Modified 4 files (auth service, middleware, routes, tests) and added 3 new dependencies.

**Key changes:**

- Created JWT service with sign/verify methods
- Added auth middleware to protect routes
- Implemented refresh token rotation
- Added 12 test cases for auth flows
```

**LLM Prompt:**

```
Analyze this completed task and provide:
1. A 1-2 sentence summary of what was accomplished
2. 3-5 key changes in bullet points
3. Complexity rating (trivial/moderate/complex)

Task prompt: {task.full_prompt}
Messages: {task.message_range.messages}
Tools used: {task.tool_uses}
Files modified: {extract_file_paths_from_edits()}
```

---

### 2. Session Summaries

**Input:** Full session (all tasks)

**Output:** High-level session report

```typescript
interface SessionSummary {
  session_id: SessionID;
  one_line: string; // Twitter-length summary
  overview: string; // 3-4 sentences
  achievements: string[]; // What was completed
  learnings: string[]; // Patterns, techniques, insights
  quality_signals: QualityMetrics;
  suggested_concepts: string[]; // Extractable reusable knowledge
}

interface QualityMetrics {
  tests_status: 'passing' | 'failing' | 'not_run' | 'unknown';
  type_errors: number;
  lint_warnings: number;
  commits_made: number;
  refactoring_ratio: number; // % of changes that were refactoring
}
```

**Example:**

```markdown
**One-line:** Built JWT authentication system with refresh tokens and role-based middleware

**Overview:**
Implemented a complete authentication system including JWT generation, token refresh flow, and role-based access control middleware. The session involved 5 tasks over 2 hours, modifying 8 files and adding 142 lines. All tests are passing with 87% coverage.

**Achievements:**

- JWT service with RS256 signing
- Refresh token rotation mechanism
- Role-based middleware (admin, user, guest)
- Comprehensive test suite (23 tests)

**Learnings:**

- Used refresh token family pattern to prevent replay attacks
- Discovered Express middleware ordering matters for auth checks
- TDD approach led to cleaner API design

**Quality Signals:**

- ✓ All 23 tests passing
- ✓ No TypeScript errors
- ✓ 87% test coverage
- ✓ 3 commits with conventional commit messages
```

---

### 3. Pattern Detection

**Goal:** Identify reusable approaches that worked well

```typescript
interface DetectedPattern {
  pattern_id: string;
  name: string;
  description: string;
  when_to_use: string;
  code_example?: string;
  sessions: SessionID[]; // Where this pattern appeared
  frequency: number; // How often used
}
```

**Example:**

```markdown
**Pattern:** Error boundary with Sentry integration

**Description:**
Wrap React components in ErrorBoundary HOC that logs to Sentry and shows fallback UI

**When to use:**
Any route-level or feature-level component that could crash and should fail gracefully

**Code example:**
\`\`\`tsx
export function withErrorBoundary(Component: React.FC) {
return (props) => (
<ErrorBoundary fallback={<ErrorFallback />} onError={logToSentry}>
<Component {...props} />
</ErrorBoundary>
);
}
\`\`\`

**Seen in:** 3 sessions (feat/error-handling, fix/crash-reports, feat/analytics)
```

**LLM Prompt:**

```
Analyze these completed tasks and identify any reusable patterns, techniques, or approaches that worked well and could be documented as concepts.

For each pattern found:
1. Give it a clear name
2. Describe what it does
3. Explain when to use it
4. Extract a minimal code example if applicable

Sessions: {multiple_session_data}
```

---

### 4. Quality Insights

**Goal:** Automated code health assessment

```typescript
interface QualityInsights {
  test_coverage_trend: 'improving' | 'declining' | 'stable';
  error_patterns: string[]; // Recurring error types
  debt_indicators: DebtIndicator[];
  refactoring_opportunities: string[];
}

interface DebtIndicator {
  type: 'todos' | 'fixmes' | 'deprecated' | 'duplication';
  count: number;
  examples: string[];
}
```

**Example:**

```markdown
**Quality Insights for Session #12**

**Test Coverage:** 📈 Improving (+5.2% this session)

- Started: 82.3%
- Ended: 87.5%
- Added 12 new test cases

**Error Patterns:**

- TypeError: 3 occurrences (accessing undefined properties)
- Async/await issues: 2 occurrences (missing error handling)

**Tech Debt:**

- 4 new TODOs added (auth token expiry edge cases)
- 1 FIXME (hardcoded API endpoint)
- Possible duplication: JWT validation logic in 2 places

**Refactoring Opportunities:**

- Consider extracting auth middleware to separate package
- Token refresh logic could be simplified with async/await
```

---

## Implementation Architecture

### When to Generate

1. **On task completion** (fast summaries)
2. **On session end** (comprehensive report)
3. **On demand** (user requests summary)

### LLM Model Selection

- **Fast summaries:** Claude Haiku (cheap, fast)
- **Pattern detection:** Claude Sonnet (better reasoning)
- **Quality insights:** Sonnet or GPT-4o (code analysis)

### Storage

```typescript
// Add to Task model
interface Task {
  // ... existing fields
  enrichment?: {
    summary?: string;
    key_changes?: string[];
    complexity?: string;
    generated_at?: string;
    model_used?: string;
  };
}

// Add to Session model
interface Session {
  // ... existing fields
  summary?: {
    one_line?: string;
    overview?: string;
    achievements?: string[];
    learnings?: string[];
    quality_signals?: QualityMetrics;
    generated_at?: string;
    model_used?: string;
  };
}
```

### API Endpoints

```typescript
// Generate enrichment on demand
POST /tasks/:id/enrich
POST /sessions/:id/summarize

// Batch enrichment for multiple tasks
POST /tasks/enrich-batch
Body: { task_ids: TaskID[] }

// Pattern detection across sessions
POST /sessions/detect-patterns
Body: { session_ids: SessionID[], min_frequency: number }
```

---

## Prompt Engineering

### Task Summary Prompt Template

```typescript
const TASK_SUMMARY_PROMPT = `You are analyzing a completed AI coding task. Generate a concise summary.

USER PROMPT:
{task.full_prompt}

CONVERSATION:
{messages_text}

TOOL USES:
{tool_use_summary}

FILES MODIFIED:
{files_modified}

Provide:
1. **Summary** (1-2 sentences): What was accomplished?
2. **Key Changes** (3-5 bullets): Specific modifications made
3. **Complexity** (trivial/moderate/complex): Rate the task difficulty

Format as JSON:
{
  "summary": "...",
  "key_changes": ["...", "..."],
  "complexity": "moderate"
}`;
```

### Session Summary Prompt Template

```typescript
const SESSION_SUMMARY_PROMPT = `You are analyzing a completed AI coding session with multiple tasks.

SESSION METADATA:
- Duration: {duration}
- Tasks: {task_count}
- Files modified: {file_count}
- Lines added: {lines_added}
- Lines removed: {lines_removed}

TASKS:
{task_summaries}

TOOL USAGE:
{tool_usage_stats}

TEST RESULTS:
{test_results}

Generate:
1. **One-line** (tweet-length summary)
2. **Overview** (3-4 sentences covering the full arc)
3. **Achievements** (bulleted list of what was completed)
4. **Learnings** (insights, patterns, techniques discovered)
5. **Quality Signals** (test status, errors, commits)
6. **Suggested Concepts** (reusable knowledge worth extracting)

Format as JSON.`;
```

---

## UI Integration

### Task Summary Display

```tsx
<TaskBlock task={task}>
  {task.enrichment?.summary && (
    <TaskSummary>
      <Icon complexity={task.enrichment.complexity} />
      <Text>{task.enrichment.summary}</Text>
      <KeyChanges items={task.enrichment.key_changes} />
    </TaskSummary>
  )}
</TaskBlock>
```

### Session Report View

```tsx
<SessionDrawer session={session}>
  <Tabs>
    <Tab label="Conversation">{/* Existing message view */}</Tab>
    <Tab label="Summary">
      <SessionReport summary={session.summary} />
    </Tab>
  </Tabs>
</SessionDrawer>
```

---

## Cost & Performance

### Token Usage Estimates

| Enrichment Type | Input Tokens | Output Tokens | Cost (Haiku) | Time   |
| --------------- | ------------ | ------------- | ------------ | ------ |
| Task summary    | ~2K          | ~200          | $0.001       | 2-3s   |
| Session summary | ~10K         | ~500          | $0.005       | 5-8s   |
| Pattern detect  | ~50K         | ~1K           | $0.025       | 10-15s |

### Caching Strategy

- Cache task summaries forever (immutable once completed)
- Invalidate session summaries if new tasks added (fork/spawn)
- Share pattern cache across workspace

---

## Future Extensions

### Comparative Analysis

```markdown
**Session Comparison: v1 auth vs v2 auth**

| Metric         | v1       | v2       | Δ      |
| -------------- | -------- | -------- | ------ |
| Duration       | 2h 15m   | 1h 30m   | -33%   |
| Files modified | 8        | 5        | -37.5% |
| Test coverage  | 87%      | 92%      | +5%    |
| Complexity     | Moderate | Moderate | Same   |

**Key Improvements:**

- v2 used middleware pattern (learned from v1)
- Better test-first approach reduced debugging time
- Reused JWT service pattern
```

### Concept Extraction

Automatically generate concept files from detected patterns:

```bash
$ agor concepts extract --from-session 0199b856

Analyzing session...
✓ Detected 2 reusable patterns

Generated concepts:
  - concepts/jwt-refresh-token-rotation.md
  - concepts/error-boundary-pattern.md

Add to session with:
  agor session add-concept 0199b856 jwt-refresh-token-rotation
```

---

## References

- Implementation: `packages/core/src/enrichment/`
- [conversation-ui.md](conversation-ui.md) - UI integration points
- [models.md](models.md) - Data model extensions
