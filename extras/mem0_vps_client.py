import requests
from typing import List, Dict, Any, Optional

class Mem0VPSClient:
    """
    Mem0 VPS Self-Hosted API Client Wrapper for Python.
    
    Bypasses platform-specific route hardcoding in the official SDK and
    points directly to bare REST endpoints on the self-hosted FastAPI server.
    """
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
        """
        Add a memory from text/messages
        :param messages: list of dicts, e.g., [{"role": "user", "content": "..."}]
        :param user_id: Big Task / Project ID
        :param agent_id: Sub-task ID
        :param run_id: Session ID
        """
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
        """
        Retrieve all memories matching filters
        """
        params = {}
        if user_id:
            params["user_id"] = user_id
        if agent_id:
            params["agent_id"] = agent_id
        if run_id:
            params["run_id"] = run_id
        return self._request("GET", "/memories", params=params)

    def search(self, query: str, user_id: str, agent_id: Optional[str] = None, run_id: Optional[str] = None, limit: Optional[int] = None) -> Dict[str, Any]:
        """
        Search memories semantically
        """
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
        """
        Delete a specific memory by its ID
        """
        return self._request("DELETE", f"/memories/{memory_id}")

    def delete_all(self, user_id: Optional[str] = None, agent_id: Optional[str] = None, run_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Delete all memories matching filters (cascade deletion)
        """
        params = {}
        if user_id:
            params["user_id"] = user_id
        if agent_id:
            params["agent_id"] = agent_id
        if run_id:
            params["run_id"] = run_id
        return self._request("DELETE", "/memories", params=params)
