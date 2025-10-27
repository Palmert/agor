# Batch 4 - Agent Testing Instructions

**CRITICAL UPDATE:** Check for runtime behavior in type files before creating tests!

---

## Summary

### Files with Runtime Behavior (6 files to test)
1. **permission-hooks.ts** (324 LOC) - Permission hook logic
2. **test-integration.ts** (388 LOC) - DB integration utilities
3. **handlebars-helpers.ts** (246 LOC) - Template helper functions
4. **transcript-parser.ts** (178 LOC) - Transcript parsing logic
5. **message-builder.ts** (166 LOC) - Message construction
6. **permission-service.ts** (153 LOC) - Permission service

### Type Files with Runtime Functions (3 files to test)
7. **board-comment.ts** (212 LOC) - Has 5 helper functions:
   - `getCommentAttachmentType()` - Determines comment attachment type
   - `isThreadRoot()` - Check if top-level comment
   - `isReply()` - Check if reply comment
   - `isResolvable()` - Check if can be resolved
   - `groupReactions()` - Group reactions by emoji

8. **session.ts** (153 LOC) - Has at least 1 function:
   - `getDefaultPermissionMode()` - Returns default permission mode by agentic tool

9. **utils.ts** (190 LOC) - Has 2+ utility functions
   - Need to test runtime behavior

### Type Files with NO Runtime Behavior (2 files - skip testing)
- **feathers.ts** (282 LOC) - Pure TypeScript interfaces only
- **mcp.ts** (228 LOC) - Pure type definitions only

---

## Instructions for Agents

### For Implementation Files (permission-hooks, test-integration, etc.)

Follow standard testing guidelines:
- 2-3x test:source ratio
- Inline helpers
- Mock external dependencies
- Avoid zealous testing
- Fix bugs found

---

### FOR TYPE FILES (board-comment, session, utils)

**NEW REQUIREMENT:** Analyze for runtime behavior first!

```markdown
## IMPORTANT: Type File Handling

Before creating tests, determine if the file has runtime behavior:

**Type-only files (NO TESTS NEEDED):**
- Pure TypeScript interfaces (`interface X { ... }`)
- Type aliases (`type X = ...`)
- Constants without logic (`export const MAX = 100`)
- Re-exports of external types

Example:
```typescript
export interface User {
  id: string;
  name: string;
}
// ❌ Don't test - no behavior

export const CommentTypes = {
  MESSAGE: 'message',
  THREAD: 'thread',
} as const;
// ❌ Don't test - constants only
```

**Runtime behavior files (TEST THESE):**
- Functions with logic
- Validators/type guards
- Helper utilities with computation
- Calculation logic

Example:
```typescript
export function getCommentAttachmentType(comment): CommentAttachmentType {
  // ✅ TEST THIS - has branching logic
  if (comment.message_id) return 'MESSAGE';
  if (comment.task_id) return 'TASK';
  return 'BOARD';
}

export function groupReactions(reactions): ReactionSummary {
  // ✅ TEST THIS - transforms data
  const grouped = {};
  for (const { emoji, user_id } of reactions) {
    if (!grouped[emoji]) grouped[emoji] = [];
    grouped[emoji].push(user_id);
  }
  return grouped;
}
```

**What to do:**
1. Scan the type file for `export function` declarations
2. If functions exist with logic → Write comprehensive tests
3. If only types/constants → Skip testing
4. Report findings in your summary
```

---

## Test Coverage Targets

| File | Source LOC | Target Ratio | Approx Test LOC |
|------|-----------|--------------|-----------------|
| permission-hooks.ts | 324 | 2-3x | 650-970 |
| test-integration.ts | 388 | 2-3x | 776-1164 |
| handlebars-helpers.ts | 246 | 2-3x | 492-738 |
| transcript-parser.ts | 178 | 2-3x | 356-534 |
| message-builder.ts | 166 | 2-3x | 332-498 |
| permission-service.ts | 153 | 2-3x | 306-459 |
| **board-comment.ts** | 212 | 1-2x | 212-424 |
| **session.ts** | 153 | 1-2x | 153-306 |
| **utils.ts** | 190 | 1-2x | 190-380 |

---

## Key Reminders

✅ **Always check for runtime functions in type files first**
✅ **Type-only files should be skipped** (no behavior to test)
✅ **Follow 2-3x ratio for implementation files, 1-2x for utilities**
✅ **Use inline helpers, avoid zealous testing**
✅ **Fix bugs found, don't align tests with bugs**
✅ **Report findings in summary** (especially for type files)

---

## Example: board-comment.ts Analysis

```markdown
## Analysis Result

**File:** board-comment.ts (212 LOC)

**Has runtime behavior?** YES

**Functions found:**
1. `getCommentAttachmentType()` - 8 lines of logic
2. `isThreadRoot()` - 1 line predicate
3. `isReply()` - 1 line predicate
4. `isResolvable()` - 1 line predicate (uses isThreadRoot)
5. `groupReactions()` - 7 lines of data transformation

**Types/constants only:**
- `BoardComment` interface
- `CommentReaction` interface
- `ReactionSummary` type
- `CommentAttachmentType` constant object
- Type aliases (BoardCommentCreate, BoardCommentPatch)

**Decision: TEST THIS FILE**

**Test focus:**
- `getCommentAttachmentType()` with all 7 attachment types
- Predicate functions (isThreadRoot, isReply, isResolvable)
- `groupReactions()` with various reaction patterns
- Edge cases (empty reactions, single emoji, duplicate users)

**Target:** 212-424 LOC (1-2x ratio for utilities)
```

---

## Batch 4 Files Summary

**9 files total:**
- 6 implementation files (standard testing)
- 3 type files with runtime behavior (check first, then test)
- 2 type files with no behavior (skip)

**Expected:** ~2,000-3,000 new test LOC
**Tests:** ~150-200 new tests
