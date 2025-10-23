<img src="https://github.com/user-attachments/assets/e34f3d25-71dd-4084-8f3e-4f1c73381c66" alt="Agor Logo" width="320" />

# Agor

**Next-gen agent orchestration for AI-assisted development.**

_The multiplayer, spatial layer that connects Claude Code, Codex, Gemini, and any agentic coding tool into one unified workspace._

A platform for **real-time, multiplayer agentic development**.
Visualize, coordinate, and automate your AI workflows across tools.
Agor turns every AI session into a composable, inspectable, and reusable building block.

📚 **[Documentation](https://mistercrunch.github.io/agor/)** | 💬 **[Discussions](https://github.com/mistercrunch/agor/discussions)**

---

## Getting Started

**Try in GitHub Codespaces (fastest):**

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/mistercrunch/agor?quickstart=1&devcontainer_path=.devcontainer%2Fplayground%2Fdevcontainer.json)

**Or run locally with Docker:**

```bash
docker compose up
# Visit http://localhost:5173 → Login: admin@agor.live / admin
```

---

## Screenshots

**[Coming soon]**

- **Board View** — Multiplayer spatial canvas with zones, real-time cursors, and session organization
- **Conversation UI** — Interactive message threads with tool outputs, diffs, and permission prompts
- **Session Creation** — Modal workflow for configuring agents, MCP servers, permissions, and worktrees
- **Admin Settings** — Configuration interface for tools, git worktrees, users, and MCP integration

---

## What Makes Agor Different

### 🧩 **Agent Orchestration Layer**

- Integrates with **Claude Code**, **Codex**, and soon **Gemini**, via an extensible SDK.
- Centralized **MCP configuration** — connect once, use across all tools.
- Swap or parallelize agents with one command; easily hand off work when one model stalls.

### 🌐 **Multiplayer Spatial Canvas**

- Real-time collaboration with **cursor broadcasting** and **facepiles**.
- Sessions live on a **dynamic board** — cluster by project, phase, or purpose.
- Visualize your full session tree: forks, spawns, subtasks, and outcomes.

### 🧠 **Context-Aware Development**

- Manage deliberate context via `context/` folder of markdown files.
- Dynamically load modular context blocks per session.
- Keep every agent’s worldview focused and version-controlled.

### 🔀 **Native Session Forking & Subtask Forcing**

- **Fork** any session to explore alternative approaches, preserving full ancestry.
- **Spawn** a subtask: Agor automatically creates a new session with a fresh context window.
- Subtasks are introspectable, reusable, and linked in the session genealogy.

### ⚙️ **Zone Triggers — Workflows Made Spatial**

- Define **zones** on your board that trigger templated prompts when sessions are dropped.
- Build **kanban-style flows** or custom pipelines: analyze → develop → review → deploy.
- Combine with context templates to automate arbitrarily complex workflows.

### 🌳 **Git Worktree Management + Lightweight Environments**

- Every session maps to an isolated **git worktree** — no branch conflicts.
- **One-click environment control** from the UI — configure start/stop commands, health endpoints, and URLs per repo.
- Automatic **port management** (each worktree gets unique ports) and **health monitoring** with status indicators.
- Run **multiple feature branches in parallel** with their own running apps (e.g., feature/auth on :4000, feature/payments on :5000).
- Works with any stack: `docker compose up`, `npm run dev`, `./manage.py runserver` — just configure in UI once.
- **Shared environments** across sessions on the same worktree — multiple agents collaborating on running code.
- **Visual status tracking** — see which environments are running, stopped, or unhealthy at a glance.

### 🕹️ **Real-Time Strategy for AI Teams**

- Coordinate agentic work like a multiplayer RTS.
- Watch teammates or agents move across tasks live.
- Cluster sessions, delegate, pivot, and iterate together.

---

## Stack

**Backend:** FeathersJS, Drizzle ORM, LibSQL
**Frontend:** React 18, TypeScript, Ant Design, React Flow
**CLI:** oclif
**Realtime:** WebSocket via Socket.io

See the [Architecture Guide](https://mistercrunch.github.io/agor/guide/architecture) for details.

---

## Roadmap

- Gemini Integration (in progress)
- Session Forking UI with genealogy visualization
- Automated Reports after task completion
- Concept Management system
- Federated Boards

---

## Contributing

TypeScript strict mode, branded types, repository pattern with Drizzle ORM.

Read [CLAUDE.md](CLAUDE.md) for development workflow and [PROJECT.md](PROJECT.md) for detailed roadmap.

---

## License

Business Source License 1.1 — see [LICENSE](LICENSE) for details.

---

> “git tracks code, Agor tracks the conversations that produced it.”
