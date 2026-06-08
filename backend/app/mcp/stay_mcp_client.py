import asyncio
import json
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional

class StayMCPClient:
    def __init__(self) -> None:
        self.process = None
        self.request_id = 0

    async def connect(self) -> None:
        """
        Spawns the MCP Server as a subprocess and hooks standard streams.
        """
        # Resolve python path and the absolute path to the services_server.py
        server_path = Path(__file__).resolve().parent / "services_server.py"
        
        self.process = await asyncio.create_subprocess_exec(
            sys.executable,
            str(server_path),
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        # Perform MCP initialize handshake
        await self._initialize_handshake()

    async def _initialize_handshake(self) -> None:
        self.request_id += 1
        init_request = {
            "jsonrpc": "2.0",
            "id": self.request_id,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {
                    "name": "stay-mcp-client",
                    "version": "1.0.0"
                }
            }
        }
        await self._write_line(json.dumps(init_request))
        response = await self._read_line()

    async def list_tools(self) -> List[Dict[str, Any]]:
        self.request_id += 1
        request = {
            "jsonrpc": "2.0",
            "id": self.request_id,
            "method": "tools/list"
        }
        await self._write_line(json.dumps(request))
        resp_str = await self._read_line()
        resp = json.loads(resp_str)
        return resp.get("result", {}).get("tools", [])

    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calls a tool on the MCP server and parses the text response content.
        """
        self.request_id += 1
        request = {
            "jsonrpc": "2.0",
            "id": self.request_id,
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments
            }
        }
        await self._write_line(json.dumps(request))
        resp_str = await self._read_line()
        resp = json.loads(resp_str)
        
        # Extract the content from the tool execution result
        contents = resp.get("result", {}).get("content", [])
        if contents and contents[0].get("type") == "text":
            return json.loads(contents[0].get("text", "{}"))
        return {"status": "error", "message": "Failed to parse tool result."}

    async def disconnect(self) -> None:
        if self.process:
            try:
                self.process.stdin.close()
                await self.process.wait()
            except Exception:
                pass

    async def _write_line(self, line: str) -> None:
        if not self.process or not self.process.stdin:
            raise RuntimeError("MCP Server not connected.")
        self.process.stdin.write((line + "\n").encode("utf-8"))
        await self.process.stdin.drain()

    async def _read_line(self) -> str:
        if not self.process or not self.process.stdout:
            raise RuntimeError("MCP Server not connected.")
        line = await self.process.stdout.readline()
        return line.decode("utf-8").strip()

# Standalone execution for testing and manual validation
async def main():
    client = StayMCPClient()
    print("Connecting to MCP Staying Places Server...")
    await client.connect()
    
    try:
        print("\nListing available tools:")
        tools = await client.list_tools()
        for t in tools:
            print(f"- {t['name']}: {t['description']}")
            
        print("\nTesting 'search_stays' tool for Emirates Stadium (Airbnb under $100):")
        result = await client.call_tool("search_stays", {
            "stadium": "Emirates Stadium",
            "accommodation_type": "airbnb",
            "max_price": 100
        })
        print(json.dumps(result, indent=2))
        
        print("\nTesting 'search_stays' price comparison (All types under $60):")
        result_compare = await client.call_tool("search_stays", {
            "stadium": "Anfield",
            "accommodation_type": "all",
            "max_price": 60
        })
        print(json.dumps(result_compare, indent=2))
        
    finally:
        print("\nDisconnecting...")
        await client.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
