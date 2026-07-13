/**
 * Mem0 VPS Self-Hosted API Client Wrapper
 * 
 * This client provides a clean interface to interact with your self-hosted Mem0 API
 * running on your VPS, bypassing the platform-specific URL routing (/v1, /v3) 
 * used by the official Cloud SDK.
 */

class Mem0VPSClient {
  constructor({ apiKey, host }) {
    this.apiKey = apiKey || 'm0sk_nvQhQI2mFwPGvHoaB1yeK4jgrBX9sWfpBAiW3i1wQ9k';
    this.host = (host || 'https://mem0-api.arisecore.org').replace(/\/+$/, '');
  }

  /**
   * Helper to make HTTP requests to the VPS API
   */
  async _request(path, options = {}) {
    const url = `${this.host}${path}`;
    const headers = {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${errorText || response.statusText}`);
      }

      // If response body is empty (e.g. 204 No Content), return success
      if (response.status === 204) {
        return { success: true };
      }

      return await response.json();
    } catch (error) {
      console.error(`Mem0 VPS Request failed [${options.method || 'GET'} ${path}]:`, error.message);
      throw error;
    }
  }

  /**
   * Add a memory from text/messages
   * @param {Object} params
   * @param {Array<Object>} params.messages - [{ role: "user", content: "..." }]
   * @param {string} params.userId - Big Task ID / User ID
   * @param {string} [params.agentId] - Sub-task ID
   * @param {string} [params.runId] - Session ID
   */
  async add({ messages, userId, agentId, runId }) {
    return this._request('/memories', {
      method: 'POST',
      body: JSON.stringify({
        messages,
        user_id: userId,
        agent_id: agentId,
        run_id: runId,
      }),
    });
  }

  /**
   * Retrieve all memories matching filters
   * @param {Object} params
   * @param {string} params.userId
   * @param {string} [params.agentId]
   * @param {string} [params.runId]
   */
  async getAll({ userId, agentId, runId }) {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId);
    if (agentId) params.append('agent_id', agentId);
    if (runId) params.append('run_id', runId);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return this._request(`/memories${queryStr}`, {
      method: 'GET',
    });
  }

  /**
   * Search memories semantically
   * @param {Object} params
   * @param {string} params.query - Semantic search query
   * @param {string} params.userId
   * @param {string} [params.agentId]
   * @param {string} [params.runId]
   * @param {number} [params.limit] - Limit search results
   */
  async search({ query, userId, agentId, runId, limit }) {
    const filters = {
      user_id: userId,
      agent_id: agentId,
      run_id: runId,
    };
    // Remove undefined filters
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

    return this._request('/search', {
      method: 'POST',
      body: JSON.stringify({
        query,
        filters,
        limit,
      }),
    });
  }

  /**
   * Delete a specific memory by ID
   * @param {string} memoryId
   */
  async delete(memoryId) {
    return this._request(`/memories/${memoryId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Delete memories matching filters
   * @param {Object} params
   * @param {string} params.userId
   * @param {string} [params.agentId]
   * @param {string} [params.runId]
   */
  async deleteAll({ userId, agentId, runId }) {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId);
    if (agentId) params.append('agent_id', agentId);
    if (runId) params.append('run_id', runId);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return this._request(`/memories${queryStr}`, {
      method: 'DELETE',
    });
  }
}

export { Mem0VPSClient };
