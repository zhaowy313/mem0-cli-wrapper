# Mem0 VPS 自建服务本地连接与集成指南 (VPS Self-Hosted Integration Guide)

本指南针对部署在 VPS 上的自建开源版 **Mem0 API 服务**，指导如何在**其他本地开发环境**（Node.js, Python, curl 等）中进行对接和使用。

> [!IMPORTANT]
> **关于 SDK 路由兼容性问题：**
> 官方提供的 JS/Python SDK（如 `MemoryClient`）是专为 Mem0 Platform 托管云服务设计的，其请求路径中硬编码了 `/v1/` 或 `/v3/` 前缀（例如请求 `/v1/ping/` 或 `/v3/memories/add/`）。
> 而您的 VPS 自建开源版 API 是基于 FastAPI 直接暴露的 bare 路由（如 `/memories`, `/search`）。
> 因此，**请勿直接使用官方 SDK 的 `MemoryClient` 构造函数**，而是应当采用本指南中提供的**轻量级 HTTP 客户端包装器**。

---

## 🔑 连接凭证 (Connection Credentials)

请在您所有的本地项目配置文件中，统一使用以下凭证：

*   **API 基础地址 (Host)**: `https://mem0-api.arisecore.org`
*   **API 密钥 (X-API-Key)**: `m0sk_nvQhQI2mFwPGvHoaB1yeK4jgrBX9sWfpBAiW3i1wQ9k`
*   **Web 控制台地址**: `https://mem0.arisecore.org` (管理员邮箱：`admin@mem0.dev` / 密码：`EQL7PnHSNwmGiQH2a4XMSg`)

---

## 📐 树状项目/任务层级映射策略

为了让 Mem0 的记忆功能完美适配多项目多任务的场景，建议沿用以下层级映射策略：

```text
user_id (大事情 / 项目 ID: 如 "livestream-project")
   ├── agent_id (小事情 / 子任务 ID: 如 "setup-sensevoice")  ──> run_id (单次会话 / 运行实例)
   ├── agent_id (小事情 / 子任务 ID: 如 "qwen-prompting")    ──> run_id (单次会话 / 运行实例)
   └── agent_id (小事情 / 子任务 ID: 如 "obs-r2-storage")    ──> run_id (单次会话 / 运行实例)
```

通过这套结构，您可以轻松通过指定不同的 `userId`、`agentId` 组合来过滤记忆的检索范围。

---

## 🟢 Node.js 环境对接方案

在您的 Node.js 项目中，无需安装庞大的 `mem0ai` SDK，可直接使用以下轻量级客户端包装器（基于 Node 18+ 原生 `fetch`）：

### 1. 客户端封装代码 (`mem0-vps-client.js`)

```javascript
/**
 * 自建 Mem0 VPS 接口包装客户端
 */
export class Mem0VPSClient {
  constructor({ apiKey, host }) {
    this.apiKey = apiKey || 'm0sk_nvQhQI2mFwPGvHoaB1yeK4jgrBX9sWfpBAiW3i1wQ9k';
    this.host = (host || 'https://mem0-api.arisecore.org').replace(/\/+$/, '');
  }

  async _request(path, options = {}) {
    const url = `${this.host}${path}`;
    const headers = {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Mem0 VPS Error [${response.status}]: ${err || response.statusText}`);
    }
    if (response.status === 204) return { success: true };
    return await response.json();
  }

  // 1. 添加记忆
  async add({ messages, userId, agentId, runId }) {
    return this._request('/memories', {
      method: 'POST',
      body: JSON.stringify({ messages, user_id: userId, agent_id: agentId, run_id: runId }),
    });
  }

  // 2. 检索所有记忆 (带过滤条件)
  async getAll({ userId, agentId, runId }) {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId);
    if (agentId) params.append('agent_id', agentId);
    if (runId) params.append('run_id', runId);
    return this._request(`/memories${params.toString() ? '?' + params.toString() : ''}`);
  }

  // 3. 语义搜索
  async search({ query, userId, agentId, runId, limit }) {
    const filters = { user_id: userId, agent_id: agentId, run_id: runId };
    Object.keys(filters).forEach(k => filters[k] === undefined && delete filters[k]);
    return this._request('/search', {
      method: 'POST',
      body: JSON.stringify({ query, filters, limit }),
    });
  }

  // 4. 删除单个记忆
  async delete(memoryId) {
    return this._request(`/memories/${memoryId}`, { method: 'DELETE' });
  }

  // 5. 级联清空记忆 (删除某项目或某子任务的所有记忆)
  async deleteAll({ userId, agentId, runId }) {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId);
    if (agentId) params.append('agent_id', agentId);
    if (runId) params.append('run_id', runId);
    return this._request(`/memories${params.toString() ? '?' + params.toString() : ''}`, { method: 'DELETE' });
  }
}
```

### 2. 使用示例 (`app.js`)

```javascript
import { Mem0VPSClient } from './mem0-vps-client.js';

const client = new Mem0VPSClient({
  apiKey: 'm0sk_nvQhQI2mFwPGvHoaB1yeK4jgrBX9sWfpBAiW3i1wQ9k',
  host: 'https://mem0-api.arisecore.org'
});

// 存储记忆
await client.add({
  messages: [{ role: 'user', content: '我们打算使用 Kokoro TTS 作为多语言配音引擎。' }],
  userId: 'livestream-project',
  agentId: 'kokoro-audio'
});

// 语义搜索
const results = await client.search({
  query: '使用了什么配音软件？',
  userId: 'livestream-project'
});
console.log(results);
```

---

## 🐍 Python 环境对接方案

在 Python 本地开发环境中，同样无需通过 pip 安装 `mem0ai`，只需使用自带的 `requests` 库请求 API 即可。

### 1. 客户端封装代码 (`mem0_vps_client.py`)

```python
import requests
from typing import List, Dict, Any, Optional

class Mem0VPSClient:
    def __init__(self, api_key: str = "m0sk_nvQhQI2mFwPGvHoaB1yeK4jgrBX9sWfpBAiW3i1wQ9k", host: str = "https://mem0-api.arisecore.org"):
        self.api_key = api_key
        self.host = host.rstrip('/')

    def _request(self, method: str, path: str, **kwargs) -> Any:
        url = f"{self.host}{path}"
        headers = kwargs.pop("headers", {})
        headers.update({
            "X-API-Key": self.api_key,
            "Content-Type": "application/json"
        })
        
        response = requests.request(method, url, headers=headers, **kwargs)
        if response.status_code == 204:
            return {"success": True}
        response.raise_for_status()
        return response.json()

    def add(self, messages: List[Dict[str, str]], user_id: str, agent_id: Optional[str] = None, run_id: Optional[str] = None) -> Dict[str, Any]:
        """添加记忆"""
        payload = {
            "messages": messages,
            "user_id": user_id
        }
        if agent_id:
            payload["agent_id"] = agent_id
        if run_id:
            payload["run_id"] = run_id
        return self._request("POST", "/memories", json=payload)

    def get_all(self, user_id: Optional[str] = None, agent_id: Optional[str] = None, run_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """获取所有记忆"""
        params = {}
        if user_id:
            params["user_id"] = user_id
        if agent_id:
            params["agent_id"] = agent_id
        if run_id:
            params["run_id"] = run_id
        return self._request("GET", "/memories", params=params)

    def search(self, query: str, user_id: str, agent_id: Optional[str] = None, run_id: Optional[str] = None, limit: Optional[int] = None) -> Dict[str, Any]:
        """语义检索记忆"""
        filters = {"user_id": user_id}
        if agent_id:
            filters["agent_id"] = agent_id
        if run_id:
            filters["run_id"] = run_id
            
        payload = {
            "query": query,
            "filters": filters
        }
        if limit:
            payload["limit"] = limit
        return self._request("POST", "/search", json=payload)

    def delete(self, memory_id: str) -> Dict[str, Any]:
        """删除单条记忆"""
        return self._request("DELETE", f"/memories/{memory_id}")

    def delete_all(self, user_id: Optional[str] = None, agent_id: Optional[str] = None, run_id: Optional[str] = None) -> Dict[str, Any]:
        """级联清除记忆"""
        params = {}
        if user_id:
            params["user_id"] = user_id
        if agent_id:
            params["agent_id"] = agent_id
        if run_id:
            params["run_id"] = run_id
        return self._request("DELETE", "/memories", params=params)
```

---

## 🌐 原始 HTTP API 参考 (Raw API / curl)

任何其他语言（如 Go, Rust 等）均可以通过标准的 HTTP client 进行对接：

### 1. 写入记忆 (Create Memory)
*   **方法/路径**: `POST https://mem0-api.arisecore.org/memories`
*   **Headers**:
    *   `X-API-Key: m0sk_nvQhQI2mFwPGvHoaB1yeK4jgrBX9sWfpBAiW3i1wQ9k`
    *   `Content-Type: application/json`
*   **Body**:
    ```json
    {
      "messages": [
        {"role": "user", "content": "平台首期太极课程定于 8 月上线。"}
      ],
      "user_id": "livestream-project",
      "agent_id": "course-planning"
    }
    ```

### 2. 搜索记忆 (Search Memory)
*   **方法/路径**: `POST https://mem0-api.arisecore.org/search`
*   **Headers**: 同上
*   **Body**:
    ```json
    {
      "query": "课程上线时间是什么时候？",
      "filters": {
        "user_id": "livestream-project"
      }
    }
    ```

### 3. 获取记忆 (Get Memories)
*   **方法/路径**: `GET https://mem0-api.arisecore.org/memories?user_id=livestream-project`
*   **Headers**: 同上

### 4. 级联清除 (Delete Memories)
*   **方法/路径**: `DELETE https://mem0-api.arisecore.org/memories?user_id=livestream-project&agent_id=course-planning`
*   **Headers**: 同上
