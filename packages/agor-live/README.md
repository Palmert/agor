# agor-live

**Multiplayer canvas for orchestrating AI coding sessions**

Agor is a real-time collaborative platform for managing Claude Code, Codex, and Gemini AI coding sessions. Visualize work on spatial boards, track git worktrees, and collaborate with your team.

## Installation

```bash
npm install -g agor-live
```

## Quick Start

```bash
# Start the daemon
agor daemon start

# Check daemon status
agor daemon status

# Open UI in browser
agor ui open

# List sessions
agor session list
```

## Features

- **Multi-Agent Support**: Claude Code, OpenAI Codex, Google Gemini
- **Git Integration**: Worktree-based workflows with branch management
- **Spatial Boards**: Visual canvas for organizing sessions and tasks
- **Real-time Collaboration**: WebSocket-powered multiplayer features
- **Task Tracking**: First-class task primitives with genealogy
- **MCP Integration**: Model Context Protocol server management

## Architecture

Agor consists of three main components (all bundled in this package):

- **Daemon**: FeathersJS backend with REST + WebSocket API
- **CLI**: oclif-based command-line interface
- **UI**: React + Ant Design web interface

## Daemon Management

```bash
# Start daemon in background
agor daemon start

# Stop daemon
agor daemon stop

# Restart daemon
agor daemon restart

# Check status
agor daemon status

# View logs
agor daemon logs
agor daemon logs --lines 100
```

## Configuration

Agor stores configuration in `~/.agor/config.yaml` and data in `~/.agor/agor.db`.

```bash
# View current configuration
agor config

# Set configuration values
agor config set daemon.port 4000
agor config set credentials.ANTHROPIC_API_KEY sk-...

# Clear active context
agor config clear
```

## Development

For development setup (contributing to Agor), see the main repository:
https://github.com/agorapp/agor

## Documentation

- **GitHub**: https://github.com/agorapp/agor
- **Issues**: https://github.com/agorapp/agor/issues

## License

BSL-1.1
