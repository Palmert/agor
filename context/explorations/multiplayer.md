# Multiplayer Collaboration for Agor

## Vision

Multiple developers collaborating on the same board, prompting agents in parallel, seeing real-time cursor movements and session updates—like Miro/Figma but for AI-assisted development.

## Core Requirements

### 1. User Identity & Authentication

**Minimal MVP:**

- Username/display name (no passwords initially)
- Persistent user ID (UUIDv7)
- Color assignment for cursor/avatar
- Optional: OAuth (GitHub, Google) for real identity

**Data Model:**

```typescript
User {
  user_id: UUID
  username: string
  display_name: string
  avatar_url?: string
  color: string  // Hex color for cursor/presence
  created_at: string
}
```

**Auth Flow:**

- Local-first: Store user in `~/.agor/user.json`
- Cloud: JWT tokens from auth service
- Websocket connection includes user_id in handshake

### 2. Presence & Awareness

**Real-time State Sync:**

- Active users on board (who's online)
- Cursor positions on canvas
- Currently viewed session (which drawer is open)
- Active typing indicators (who's prompting which session)

**Presence Model:**

```typescript
Presence {
  user_id: UUID
  board_id: UUID
  cursor_position?: { x: number, y: number }
  viewing_session_id?: SessionID
  active_prompt?: {
    session_id: SessionID
    typing: boolean
  }
  last_seen: string
}
```

**WebSocket Events:**

- `presence:join` - User enters board
- `presence:leave` - User exits board
- `presence:update` - Cursor move, session change
- `presence:typing` - Typing indicator start/stop

### 3. Collaborative Session Access

**Permissions Model:**

- Board owner can invite collaborators
- Collaborators can view all sessions on board
- Collaborators can prompt any session (unless locked)
- Session locking (optional): Prevent concurrent prompts

**Conflict Resolution:**

- Optimistic UI updates (local changes apply immediately)
- Last-write-wins for simple fields
- Operational Transformation (OT) for concurrent edits (future)
- Session lock prevents multiple agents running simultaneously

### 4. Real-time Data Sync

**Current State (V1 - Local):**

- Single client, single daemon
- WebSocket for message streaming only

**Multiplayer Requirements (V2):**

- Broadcast all CRUD operations to connected clients
- Session create/update/delete → all clients receive event
- Task updates → live status sync
- Message creation → live conversation updates
- Board changes → canvas re-renders for all users

**Event Broadcasting:**

```typescript
// Server broadcasts to all clients on same board
socket.broadcast.to(`board:${boardId}`).emit('session:created', session);
socket.broadcast.to(`board:${boardId}`).emit('session:updated', updates);
socket.broadcast.to(`board:${boardId}`).emit('message:created', message);
```

### 5. Cursor & Interaction Tracking

**Visual Indicators:**

- Cursors with username labels (like Figma)
- Session cards highlight when user is viewing
- Prompt input shows "User is typing..." indicator
- Mini avatars on active sessions

**Cursor Sync:**

- Throttle cursor movements (send every 50-100ms)
- Interpolate between positions for smoothness
- Hide cursor after 5s of inactivity
- Different cursor styles (pointer, grab, text)

### 6. Canvas State Sync

**Board Layout Sync:**

- Session card positions (x, y coordinates)
- Zoom level and pan position (optional: sync viewport)
- Session arrangement updates broadcast to all

**React Flow Integration:**

- Shared node positions via WebSocket
- Conflict resolution: Last drag wins
- Lock sessions during drag to prevent conflicts
- Auto-layout button to organize for everyone

## Implementation Phases

### Phase 1: Infrastructure (Cloud Migration)

**Prerequisites:**

1. **Database Migration**
   - LibSQL (local) → PostgreSQL (cloud)
   - Prisma or Drizzle with cloud adapter
   - Connection pooling for concurrent clients

2. **Authentication Service**
   - Simple user registration (username/password)
   - JWT token generation/validation
   - Session management (refresh tokens)

3. **WebSocket Room Management**
   - Socket.io rooms per board (`board:${boardId}`)
   - User presence tracking in Redis
   - Heartbeat for online/offline detection

### Phase 2: Presence System

**Features:**

1. **User List Sidebar**
   - Show all active users on board
   - Avatar + username + online status
   - Click to jump to their viewport (optional)

2. **Cursor Rendering**
   - SVG cursor overlays on canvas
   - Smooth interpolation between positions
   - Username label with user color

3. **Typing Indicators**
   - "User is prompting Session X..." in prompt input
   - Animated dots for typing state

### Phase 3: Real-time Collaboration

**Features:**

1. **Live Session Updates**
   - All CRUD ops broadcast via WebSocket
   - Optimistic updates with server reconciliation
   - Conflict indicators if divergence detected

2. **Concurrent Prompting**
   - Multiple users can prompt different sessions
   - Session locking (optional toggle)
   - Queue prompts if session locked

3. **Shared Canvas State**
   - Session positions sync across clients
   - Pan/zoom sync (optional, can be per-user)
   - Auto-layout applies to all users

### Phase 4: Advanced Collaboration

**Features:**

1. **Permissions & Roles**
   - Board owner, editor, viewer roles
   - Invite links with permissions
   - Session-level permissions (lock to owner)

2. **Activity Feed**
   - "User created Session X"
   - "User forked Session Y"
   - "User completed Task Z"

3. **Comments & Annotations**
   - Comment threads on sessions
   - @ mentions for notifications
   - Resolve/unresolve threads

## Technical Architecture

### Backend Changes

**Current (V1):**

```
User → Daemon (FeathersJS) → SQLite
        ↓
    WebSocket (message streaming)
```

**Multiplayer (V2):**

```
Users → Cloud API (FeathersJS + Auth) → PostgreSQL
         ↓
    Socket.io Rooms (per board)
         ↓
    Redis (presence, sessions)
```

**Key Components:**

- **Auth Middleware**: Verify JWT on WebSocket handshake
- **Room Manager**: Join/leave board rooms automatically
- **Presence Service**: Track user state, emit updates
- **Broadcast Hooks**: Feathers hooks to emit events after CRUD ops

### Frontend Changes

**New Hooks:**

```typescript
// Track online users
usePresence(boardId: string): User[]

// Track user cursors
useCursors(boardId: string): Map<UserID, CursorPosition>

// Broadcast local cursor
useCursorBroadcast(boardId: string)

// Show who's typing
useTypingIndicators(sessionId: SessionID): User[]
```

**New Components:**

- `<PresenceSidebar>` - Online users list
- `<CursorOverlay>` - Render remote cursors
- `<TypingIndicator>` - "User is typing..."
- `<ActivityFeed>` - Recent actions log

## Data Migration Path

### Local → Cloud Transition

**Option 1: Dual Mode**

- V1 continues with local SQLite
- V2 adds cloud option (user chooses)
- Import/export to migrate data

**Option 2: Cloud-First**

- V2 removes local mode entirely
- Provide migration tool: `agor migrate --to-cloud`
- One-time sync of local data to cloud

**Recommended:** Option 1 (dual mode)

- Allows dogfooding both modes
- Gradual migration for users
- Local mode for privacy-sensitive work

## Security Considerations

### Access Control

- Board visibility: Private (invite-only) vs Public
- Rate limiting on prompts (prevent abuse)
- Session isolation (can't access sessions outside your boards)
- API key management (who pays for Claude API?)

### Data Privacy

- End-to-end encryption for messages (optional)
- Per-board encryption keys (team controls access)
- Audit logs for compliance (who accessed what)

## Performance Considerations

### Scalability

- WebSocket connections: Use Socket.io with Redis adapter
- Database queries: Optimize with indexes, connection pooling
- Cursor broadcasts: Throttle to 20 updates/sec per user
- Presence updates: Batch and debounce

### Bandwidth Optimization

- Compress WebSocket messages (JSON + gzip)
- Send deltas instead of full objects
- Cursor position: Send only when changed >5px
- Message streaming: Progressive rendering, not full reload

## User Experience Goals

### "It Just Works" Collaboration

✅ **No friction** - Join board via link, start collaborating
✅ **Instant feedback** - See changes in <100ms
✅ **Clear awareness** - Always know who's doing what
✅ **No conflicts** - System prevents/resolves automatically
✅ **Feels live** - Like Figma/Miro, but for agent orchestration

### Team Workflows

**Example 1: Pair Programming**

- Both users on same board
- User A prompts Session 1 (backend work)
- User B prompts Session 2 (frontend work)
- Both see each other's progress in real-time

**Example 2: Code Review**

- Reviewer joins board via link
- Sees session tree, clicks through tasks
- Leaves comments on specific sessions
- Author gets notified, addresses feedback

**Example 3: Onboarding**

- New team member joins board
- Browses historical sessions to understand decisions
- Sees what senior dev is working on (live cursor)
- Learns patterns by observing

## Open Questions

1. **Billing Model**: Who pays for API usage? Per-user? Per-board? Shared team credits?
2. **Offline Support**: What happens if cloud goes down? Local fallback mode?
3. **Version Control**: Should boards/sessions be git-like (branches, merges)? Or simpler?
4. **Agent Quotas**: Limit concurrent agents per team to prevent runaway costs?
5. **Session Replay**: Record all actions for playback (like session replay tools)?

## Next Steps

### V1 → V2 Transition Checklist

**Prerequisites:**

- [ ] Migrate LibSQL → PostgreSQL (cloud DB)
- [ ] Add user authentication (JWT-based)
- [ ] Deploy daemon to cloud (Heroku, Railway, Render)
- [ ] Set up Socket.io with Redis adapter

**Phase 1 (Presence):**

- [ ] User registration/login flow
- [ ] Presence tracking (online/offline)
- [ ] Cursor position sync
- [ ] User list sidebar

**Phase 2 (Collaboration):**

- [ ] Broadcast all CRUD events
- [ ] Optimistic UI updates
- [ ] Live session status sync
- [ ] Typing indicators

**Phase 3 (Polish):**

- [ ] Board permissions & invites
- [ ] Activity feed
- [ ] Comments on sessions
- [ ] Performance optimization

## References

- **Multiplayer Patterns**: [Yjs CRDT library](https://github.com/yjs/yjs)
- **Presence Examples**: [Liveblocks](https://liveblocks.io/), [PartyKit](https://partykit.io/)
- **Cursor Sync**: [Perfect Cursors](https://github.com/steveruizok/perfect-cursors)
- **WebSocket Scaling**: [Socket.io with Redis](https://socket.io/docs/v4/redis-adapter/)

---

**Status:** Exploration
**Target:** V2 (Q4 2025)
**Dependencies:** Cloud infrastructure, user auth, database migration
