# Mem0 CLI Wrapper for Self-Hosted VPS

A zero-dependency, lightweight Node.js CLI wrapper designed to replace the official `@mem0/cli` (or Python `mem0-cli`) commands when working with a **self-hosted Mem0 FastAPI REST backend**.

---

## Why is this needed?

The official Mem0 CLI packages (both Node.js and Python versions) hardcode request routes (such as `/v3/memories/add/`, `/v1/ping/`) and use `Authorization: Token <api_key>` headers. 

If you self-host a Mem0 FastAPI instance, your API expects bare REST endpoints (such as `POST /memories`, `POST /search`) and expects `X-API-Key` headers for authentication. The official CLIs will return `404 Not Found` or `401 Unauthorized` errors.

This project resolves those issues by acting as a transparent, dynamic wrapper that maps commands onto your self-hosted API endpoints, while maintaining 100% command parity and configurations.

---

## Features

- **Zero Dependencies**: Pure, vanilla Node.js code utilizing standard native `fetch`. Runs instantly on any machine.
- **Dynamic Parameter Parsing**: Full support for standard Mem0 filters including `-u`/`--user-id`, `--agent-id`, `--run-id`, `--app-id`, and `--metadata '{"json": true}'`.
- **JSON/Agent Mode**: Use `--json` or `--agent` flags to return raw machine-readable JSON data—essential for other LLM agents (e.g., Claude Code, Cursor) parsing memories programmatically.
- **Extended Subcommands**: Supports `status`, `list`, `add`, `search`, `update`, `delete`, and `entity [list|delete]`.
- **Automatic SaaS Fallback**: If you execute a command specific to the SaaS platform (such as `whoami` or `event`), or if the self-hosted server connection fails, it automatically routes the command to the official CLI.

---

## Installation

### Method 1: Local Installation (Recommended)

1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/mem0-cli-wrapper.git
   cd mem0-cli-wrapper
   ```

2. Install globally using `npm`:
   ```bash
   npm install -g .
   ```
   *Note: This will symlink the `mem0` command to point to this wrapper.*

### Method 2: Direct Install via GitHub

Install directly from your GitHub repository globally:
```bash
npm install -g git+https://github.com/your-username/mem0-cli-wrapper.git
```

---

## Configuration

This wrapper reads from and writes to the official config file at `~/.mem0/config.json`. You can continue using `mem0 config` commands to update it:

```bash
# Set your self-hosted API endpoint
mem0 config set platform.base_url "https://your-mem0-api.example.com"

# Set your self-hosted X-API-Key
mem0 config set platform.api_key "m0sk_your_custom_api_key"

# Set default user context
mem0 config set defaults.user_id "your_default_user"
```

---

## Usage Examples

### 1. Verify Connection
```bash
mem0 status
```

### 2. Add Memory
```bash
mem0 add "Mem0 wrapper script is fully functional." --user-id alice --agent-id coder-agent
```

### 3. List Memories
```bash
# List all memories under current user context
mem0 list

# List memories for a specific agent across all users
mem0 list --agent-id coder-agent

# Output list results as strict JSON format
mem0 list --agent-id coder-agent --json
```

### 4. Semantic Search
```bash
mem0 search "wrapper script" --agent-id coder-agent
```

### 5. Update Memory
```bash
mem0 update <memory_id> "Updated memory text" --metadata '{"category": "test"}'
```

### 6. Delete Memories
```bash
# Delete a specific memory
mem0 delete <memory_id>

# Cascade delete all memories matching filter
mem0 delete --all --user-id alice
```

### 7. Manage Entities
```bash
# List all registered entities (users, agents, runs)
mem0 entity list

# Cascade delete an entity and all its memories
mem0 entity delete agent coder-agent
```

---

## License

This project is licensed under the [MIT License](LICENSE).
