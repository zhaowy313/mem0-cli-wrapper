# Mem0 Local Development & Integration Guide

This guide describes how to connect your local development environment (spanning both **Windows** and **Linux**) to your self-hosted Mem0 API server running on your VPS.

---

## 🔑 Connection Credentials

Use these details to configure the Mem0 SDK or raw HTTP clients in your local projects:

*   **API Host (Endpoint)**: `https://mem0-api.arisecore.org`
*   **API Key (`X-API-Key`)**: `m0sk_nvQhQI2mFwPGvHoaB1yeK4jgrBX9sWfpBAiW3i1wQ9k`
*   **Web Dashboard URL**: `https://mem0.arisecore.org` (Login: `admin@mem0.dev` / `EQL7PnHSNwmGiQH2a4XMSg`)

---

## 📐 Project Task-Hierarchy Mapping Strategy (Your Chosen Paradigm)

To manage projects and tasks, you have redefined the default meaning of `user_id`, `agent_id`, and `run_id` as a hierarchical project model:

```text
user_id (Big Task / 大事情: e.g. "livestream-project")
   ├── agent_id (Sub-task / 小事情: e.g. "setup-sensevoice")  ──> run_id (Single Session / 单次会话)
   ├── agent_id (Sub-task / 小事情: e.g. "qwen-prompting")    ──> run_id (Single Session / 单次会话)
   └── agent_id (Sub-task / 小事情: e.g. "obs-r2-storage")    ──> run_id (Single Session / 单次会话)
```

This mapping works beautifully with Mem0's database filters. Here is how your queries behave under this structure:

### 1. Global Project Scoping (Retrieve everything for the Big Task)
Querying with only `user_id` aggregates memories across all sub-tasks in that project.
*   **Python**: `client.get_all(user_id="livestream-project")`
*   **Node.js**: `client.getAll({ filters: { user_id: "livestream-project" } })`

### 2. Task-Specific Scoping (Query a specific sub-task)
Filtering by both `user_id` and `agent_id` searches only inside the context of the sub-task.
*   **Python**: `client.search(query="how to install", user_id="livestream-project", agent_id="setup-sensevoice")`
*   **Node.js**: `client.search({ query: "how to install", userId: "livestream-project", agentId: "setup-sensevoice" })`

### 3. Session-Specific Scoping (Query single conversation)
Add `run_id` to read or write only to the current session.
*   **Python**: `client.add(messages=[...], user_id="livestream-project", agent_id="setup-sensevoice", run_id="session-456")`

### 4. Project Cleanup / Reset
You can cascade-delete memories using the hierarchy:
*   **Delete a specific sub-task's memories**: `client.delete_all(user_id="livestream-project", agent_id="setup-sensevoice")`
*   **Delete the entire project**: `client.delete_all(user_id="livestream-project")`

---

## 🐍 Python SDK Setup (Windows / Linux)

### 1. Installation
Install the official Mem0 library in your Python environment:
```bash
pip install mem0ai
```

### 2. Integration Template
Use this template in your project. It initializes the `MemoryClient` to talk to your VPS over HTTPS:

```python
from mem0 import MemoryClient

# Configure the client to connect to your VPS endpoint
client = MemoryClient(
    api_key="m0sk_nvQhQI2mFwPGvHoaB1yeK4jgrBX9sWfpBAiW3i1wQ9k",
    host="https://mem0-api.arisecore.org"
)

# Define your project scope
USER_ID = "developer-user"
AGENT_ID = "coding-assistant"
PROJECT_ID = "project-linux-backend"  # Use this to separate projects

# 1. Store a memory for this project + agent
client.add(
    messages=[
        {"role": "user", "content": "I prefer using poetry for dependency management and Ruff for linting."}
    ],
    user_id=USER_ID,
    agent_id=AGENT_ID,
    run_id=PROJECT_ID
)

# 2. Retrieve memories for this project + agent
memories = client.get_all(
    user_id=USER_ID,
    agent_id=AGENT_ID,
    run_id=PROJECT_ID
)
print("=== Stored Memories ===")
for m in memories:
    print(f"- [{m['id']}] {m['memory']}")

# 3. Search memories dynamically
search_results = client.search(
    query="How do I manage python dependencies?",
    user_id=USER_ID,
    agent_id=AGENT_ID,
    run_id=PROJECT_ID
)
print("\n=== Search Results ===")
for r in search_results:
    print(f"- Memory: {r['memory']} (Score: {r['score']})")
```

---

## 🟢 Node.js SDK Setup (Windows / Linux)

### 1. Installation
Install the NPM package in your project folder:
```bash
npm install mem0ai
# or
pnpm add mem0ai
# or
yarn add mem0ai
```

### 2. Integration Template
Use this template in your Node.js or TypeScript files:

```javascript
import { MemoryClient } from 'mem0ai';

const client = new MemoryClient({
  apiKey: 'm0sk_nvQhQI2mFwPGvHoaB1yeK4jgrBX9sWfpBAiW3i1wQ9k',
  host: 'https://mem0-api.arisecore.org'
});

const USER_ID = 'developer-user';
const AGENT_ID = 'frontend-assistant';
const PROJECT_ID = 'project-windows-gui';

async function run() {
  // 1. Add memory
  await client.add({
    messages: [{ role: 'user', content: 'I am building the desktop UI using Electron and React.' }],
    userId: USER_ID,
    agentId: AGENT_ID,
    runId: PROJECT_ID
  });

  // 2. Search memories
  const searchResults = await client.search({
    query: 'What tools are used for building the desktop UI?',
    userId: USER_ID,
    agentId: AGENT_ID,
    runId: PROJECT_ID
  });

  console.log('=== Search Results ===');
  console.log(searchResults);
}

run();
```

---

## 🌐 Raw HTTP API (Any Language / Command Line)

If you are developing in other environments (e.g. Go, Rust, or inside LangChain/Autogen frameworks without the native SDK), you can interact directly with the REST endpoints using any standard HTTP library.

### 1. Create Memory (`POST /memories`)
*   **URL**: `https://mem0-api.arisecore.org/memories`
*   **Headers**:
    *   `X-API-Key: m0sk_nvQhQI2mFwPGvHoaB1yeK4jgrBX9sWfpBAiW3i1wQ9k`
    *   `Content-Type: application/json`
*   **Payload**:
```json
{
  "messages": [
    {"role": "user", "content": "I like dark mode themes for my IDE."}
  ],
  "user_id": "developer-user",
  "agent_id": "ux-agent",
  "run_id": "project-all"
}
```

### 2. Search Memory (`POST /memories/search`)
*   **URL**: `https://mem0-api.arisecore.org/memories/search`
*   **Headers**: Same as above
*   **Payload**:
```json
{
  "query": "Which IDE theme should I use?",
  "filters": {
    "user_id": "developer-user",
    "agent_id": "ux-agent",
    "run_id": "project-all"
  }
}
```

### 3. Delete All Memories for a Project/Agent (`DELETE /memories`)
*   **URL**: `https://mem0-api.arisecore.org/memories`
*   **Headers**: Same as above
*   **Query Parameters**:
    *   `user_id=developer-user`
    *   `agent_id=ux-agent`
    *   `run_id=project-all`
*   **Behavior**: Deletes all memories matching the filters. Useful for clearing project context.

---

## 🧩 Project-Centric Memory Ingestion (custom_instructions)

To ensure Mem0 extracts facts from a **project/system perspective** (rather than a "personal diary" perspective), you should configure `custom_instructions` on the server.

Below is the optimized, custom prompt designed specifically for your **Tai Chi Video Courses and Live-Streaming E-Commerce Platform**:

```python
project_extraction_instructions = """
## ROLE
You are a precise Project Knowledge Extractor for a Tai Chi Video Courses and Live-Streaming E-Commerce Platform.

## OBJECTIVE
Extract only crisp, atomic, durable facts about architecture decisions, infrastructure choices, e-commerce operations, payment setups, video course content structure, streaming pipelines, and business rules from the input text. Ignore all conversational, emotional, or transient content.

## STRICT RULES
1. NEVER use "User", "I", "we", "person", or any anthropomorphic language. Always frame facts from a project/system perspective.
   - Bad: "User integrated Wise payment today."
   - Good: "Platform integrates Wise payment gateway for global payouts."

2. Focus exclusively on durable knowledge across three domains:
   - **E-Commerce & Business Operations**: Payment gateways (Wise, Venn, Stripe), pricing, product structures (memberships, video course packages), taxation, checkout workflows, and user subscriptions.
   - **Technical & Live-Streaming Infrastructure**: Broadcasting software (OBS), streaming protocol setups, virtual audio routing, and real-time AI pipelines (ASR/SenseVoice, translation models, Kokoro TTS).
   - **Content & Video Operations**: Video course syllabus structure, capturing and editing formats, Tai Chi technical terminology, and translations of traditional movements.

3. Keep every fact atomic, self-contained, and high-density. Remove all fluff, session logs, emotions, and temporary observations.

4. Output MUST be a valid JSON array of strings. Each string is one atomic fact. Never add explanations or markdown.

## EXAMPLES

Input: "太极精要视频课定价定好了，单买 199 元，买年度会员可以免费看所有视频课。今天先在 Stripe 上把这个 Product 建出来。"
Output: [
  "Platform configures Tai Chi Essentials video course pricing at 199 CNY for single purchase",
  "Platform grants full access to all video courses for active annual members",
  "Platform uses Stripe to define course products and pricing structures"
]

Input: "今天测试发现 SenseVoice 配合虚拟声卡把直播伴音送过去识别很稳，但 Qwen 翻译太极术语比如 '野马分鬃' 时容易直接直翻成 wild horse, 我们需要在提示词里纠正成 Wild Horse's Mane。"
Output: [
  "Platform integrates SenseVoice and virtual audio cards for stable live-streaming audio transcription",
  "Platform implements Qwen translation correcting traditional Tai Chi terms such as '野马分鬃' to 'Wild Horse's Mane'"
]
"""
```

### Applying the Configuration
You can post this configuration to your self-hosted server using the `/configure` endpoint:
```bash
curl -X POST "https://mem0-api.arisecore.org/configure" \
     -H "X-API-Key: m0sk_nvQhQI2mFwPGvHoaB1yeK4jgrBX9sWfpBAiW3i1wQ9k" \
     -H "Content-Type: application/json" \
     -d '{
       "custom_instructions": "YOUR_ESCAPED_INSTRUCTIONS_PROMPT"
     }'
```
Or configure it in the Web Dashboard (`https://mem0.arisecore.org`) under **Configuration**.

---

## 🔀 Naming Conventions: snake_case vs camelCase

Depending on whether you are using the Python SDK, JS/TS SDK, or raw HTTP API, the key casing varies:

| Environment | Keys Casing | Examples | Explanation |
| :--- | :--- | :--- | :--- |
| **Python SDK** | `snake_case` | `user_id`, `agent_id`, `run_id` | Standard Python coding convention. |
| **Node.js (JS/TS) SDK** | `camelCase` | `userId`, `agentId`, `runId` | Standard JS/TS coding convention. The JS/TS SDK **internally converts** these to `snake_case` before sending requests to the API. |
| **Raw HTTP / curl** | `snake_case` | `user_id`, `agent_id`, `run_id` | The FastAPI server and PostgreSQL JSONB payload store keys strictly in `snake_case`. |


