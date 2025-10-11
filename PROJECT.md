# Agor Project

> **Next-gen agent orchestration platform** - Manage unlimited AI coding agents in hyper-context-aware session trees.

**See [context/](context/) for complete architecture, data models, and design documentation.**

---

## What Is Agor?

**Agor is an agent orchestrator** - the platform layer that sits above all agentic coding tools (Claude Code, Cursor, Codex, Gemini), providing unified session management, visual session trees, and automatic knowledge capture.

**Core Insight:** Context engineering isn't about prompt templates—it's about managing sessions, tasks, and concepts as first-class composable primitives stored in a session tree.

**See:** [context/concepts/core.md](context/concepts/core.md) for vision and primitives.

---

## Current Implementation Status

### ✅ What's Built

**Backend & Data** - Fully operational FeathersJS daemon with real-time capabilities

- FeathersJS REST + WebSocket daemon (:3030)
- Drizzle ORM + LibSQL database
- Sessions, Tasks, Messages, Repos, Boards services
- UUIDv7 IDs with short ID resolution
- Git operations: clone, worktree management
- Claude Agent SDK integration with live execution
- Progressive WebSocket message streaming

**UI & Frontend** - Complete React component library with live data

- SessionCanvas with React Flow tree visualization
- SessionCard with drag handles and task preview
- SessionDrawer with task-centric ConversationView
- Real-time message streaming and task updates
- Board organization and session management
- Complete Ant Design component system

**CLI Tools** - Operational session and repo management

- `agor init` - Database initialization
- `agor session list/load-claude` - Session management
- `agor repo add/list/worktree` - Repository and worktree operations
- `agor board list/add-session` - Board organization
- `agor config` - Configuration management

**Architecture Documentation** - Complete concept documentation in `context/concepts/`

- Core primitives and data models
- WebSocket architecture and real-time patterns
- Conversation UI patterns
- Agent integration strategy
- Frontend guidelines and token-based styling

**See:** [CLAUDE.md](CLAUDE.md) for complete implementation details and development guide.

---

## Active TODO List

### High Priority

- [ ] **Session forking** - Fork sessions at decision points
  - Wire fork button in UI to daemon API
  - Create new session with genealogy relationship
  - Display genealogy tree on canvas (React Flow edges)
  - Add fork metadata (decision point, timestamp)

- [ ] **Save session positions on board** - Persist canvas layout
  - Store x/y coordinates in database
  - Update on drag end
  - Restore positions on board load

- [ ] **Session state transitions** - Idle → Running → Completed lifecycle
  - Implement state machine in daemon
  - UI indicators for each state
  - Auto-transition based on activity

### Medium Priority

- [ ] **Genealogy tree visualization** - Show session relationships
  - React Flow edges between parent/child sessions
  - Distinguish fork (dashed) vs spawn (solid) relationships
  - Interactive tree exploration

- [ ] **Token usage tracking** - Track costs from Agent SDK
  - Capture token metadata from Claude responses
  - Display in UI (session card, conversation view)
  - Aggregate costs across sessions

- [ ] **CLI session commands**
  - `agor session show <id>` - Detailed session view with genealogy
  - `agor session create` - Interactive session wizard
  - `agor session fork/spawn` - Create child sessions

### Future Features

- [ ] **Concept management** - Modular context composition
  - Define, attach, and detach concepts from sessions
  - Concept library UI
  - Auto-suggest relevant concepts

- [ ] **Report generation** - Auto-generate summaries from completed tasks
  - LLM-powered task summaries
  - Session-level reports
  - Export capabilities

- [ ] **Optional tool execution** - Enable Claude tools with UX design
  - Tool allowlist configuration
  - Permission/approval flow
  - Tool execution feedback in UI

- [ ] **Desktop packaging** - Electron/Tauri wrapper
  - Bundled daemon (auto-start)
  - System tray integration
  - Native file system access

- [ ] **Multi-agent abstraction** - Support for Cursor, Codex, Gemini
  - Agent adapter interface
  - Agent-specific message formats
  - Unified conversation view

---

## Roadmap

### V1: Local Desktop App (Target: Q2 2025)

**Goal:** Full-featured local agent orchestrator with GUI + CLI

**Core Capabilities:**

- Multi-agent session management (Claude Code, Cursor, Codex, Gemini)
- Visual session tree canvas with fork/spawn genealogy
- Git worktree integration for isolated parallel sessions
- Concept library for modular context composition
- Automatic report generation from completed tasks
- Local-only (no cloud, SQLite-based)

**Deliverables:**

- Desktop app (Electron or Tauri)
- Standalone CLI binary (`agor`)
- Documentation + tutorials

### V2: Agor Cloud (Target: Q4 2025)

**Goal:** Real-time collaborative agent orchestration

**New Capabilities:**

- Cloud-hosted sessions (migrate LibSQL → PostgreSQL)
- Real-time multiplayer (multiple devs, same session tree)
- Shared concept libraries (team knowledge bases)
- Pattern recommendations (learn from successful session workflows)
- Session replay/export for knowledge sharing

**Tagline:** _Real-time strategy multiplayer for AI development_

**See:** [README.md](README.md) for full product vision.

---

## Project Structure

```
agor/
├── apps/
│   ├── agor-daemon/       # FeathersJS backend (REST + WebSocket)
│   ├── agor-cli/          # CLI tool (oclif)
│   └── agor-ui/           # React UI (Storybook-first)
│
├── packages/
│   └── core/              # Shared @agor/core package
│       ├── types/         # TypeScript types
│       ├── db/            # Drizzle ORM + repositories
│       ├── git/           # Git utilities
│       ├── claude/        # Claude Code integration
│       └── api/           # FeathersJS client
│
└── context/               # Architecture documentation
    ├── concepts/          # Core design docs (read first)
    └── explorations/      # Experimental designs
```

**Monorepo:** Turborepo + pnpm workspaces

---

## Quick Start

### Run Daemon

```bash
cd apps/agor-daemon
pnpm dev  # Starts on :3030
```

### Use CLI

```bash
# Initialize database
pnpm agor init

# Import a Claude Code session
pnpm agor session load-claude <session-id>

# List sessions
pnpm agor session list
```

### Develop UI

```bash
cd apps/agor-ui
pnpm storybook  # Component development
pnpm dev        # Full app
```

**See:** [CLAUDE.md](CLAUDE.md) for complete development guide.

---
