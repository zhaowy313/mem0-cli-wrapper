#!/usr/bin/env node

/**
 * Self-Hosted Mem0 VPS MCP Server (Stdio Transport)
 * 
 * Exposes Mem0 memory operations as MCP tools to Antigravity (agy) or other
 * MCP clients. Bypasses standard SDK routing to target the VPS correctly.
 * 
 * All logging MUST go to stderr (console.error) to avoid corrupting the stdio channel.
 */

import readline from 'readline';
import { Mem0VPSClient } from './mem0-vps-client.js';

const client = new Mem0VPSClient({
  apiKey: 'm0sk_nvQhQI2mFwPGvHoaB1yeK4jgrBX9sWfpBAiW3i1wQ9k',
  host: 'https://mem0-api.arisecore.org'
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Helper to write JSON-RPC response to stdout
function sendResponse(response) {
  process.stdout.write(JSON.stringify(response) + '\n');
}

// Helper to send error response
function sendError(id, code, message) {
  sendResponse({
    jsonrpc: '2.0',
    id,
    error: { code, message }
  });
}

rl.on('line', async (line) => {
  if (!line.trim()) return;

  let request;
  try {
    request = JSON.parse(line);
  } catch (e) {
    console.error('Failed to parse incoming JSON-RPC message:', e.message);
    sendResponse({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: 'Parse error' }
    });
    return;
  }

  const { method, params, id } = request;
  console.error(`Received request: method=${method}, id=${id}`);

  try {
    switch (method) {
      case 'initialize': {
        sendResponse({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: 'mem0-vps-mcp',
              version: '1.0.0'
            }
          }
        });
        break;
      }

      case 'notifications/initialized': {
        // No-op for initialized notification
        break;
      }

      case 'tools/list': {
        const tools = [
          {
            name: 'mem0_add',
            description: 'Add a new memory to the self-hosted Mem0 VPS store.',
            inputSchema: {
              type: 'object',
              properties: {
                messages: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      role: { type: 'string', description: 'The role (user or assistant).' },
                      content: { type: 'string', description: 'The content of the message.' }
                    },
                    required: ['role', 'content']
                  },
                  description: 'The messages to extract facts from.'
                },
                userId: { type: 'string', description: 'The main user or project ID (e.g. livestream-project).' },
                agentId: { type: 'string', description: 'Optional sub-task ID.' },
                runId: { type: 'string', description: 'Optional session ID.' }
              },
              required: ['messages', 'userId']
            }
          },
          {
            name: 'mem0_search',
            description: 'Search memories semantically in the self-hosted Mem0 VPS store.',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'The semantic query to search for.' },
                userId: { type: 'string', description: 'The main user or project ID.' },
                agentId: { type: 'string', description: 'Optional sub-task ID.' },
                runId: { type: 'string', description: 'Optional session ID.' },
                limit: { type: 'number', description: 'Optional limit on results.' }
              },
              required: ['query', 'userId']
            }
          },
          {
            name: 'mem0_get_all',
            description: 'Retrieve all memories matching the specified filters.',
            inputSchema: {
              type: 'object',
              properties: {
                userId: { type: 'string', description: 'Filter by user or project ID.' },
                agentId: { type: 'string', description: 'Optional sub-task ID filter.' },
                runId: { type: 'string', description: 'Optional session ID filter.' }
              },
              required: ['userId']
            }
          }
        ];

        // Only expose delete tools if explicitly allowed in environment
        if (process.env.ALLOW_MEM0_DELETE === 'true') {
          tools.push(
            {
              name: 'mem0_delete',
              description: 'Delete a specific memory by its unique ID.',
              inputSchema: {
                type: 'object',
                properties: {
                  memoryId: { type: 'string', description: 'The unique ID of the memory to delete.' }
                },
                required: ['memoryId']
              }
            },
            {
              name: 'mem0_delete_all',
              description: 'Cascade delete all memories matching the specified filters.',
              inputSchema: {
                type: 'object',
                properties: {
                  userId: { type: 'string', description: 'The user or project ID to clear.' },
                  agentId: { type: 'string', description: 'Optional sub-task ID.' },
                  runId: { type: 'string', description: 'Optional session ID.' }
                },
                required: ['userId']
              }
            }
          );
        }

        sendResponse({
          jsonrpc: '2.0',
          id,
          result: { tools }
        });
        break;
      }

      case 'tools/call': {
        const { name, arguments: args } = params || {};
        console.error(`Executing tool: name=${name}`);
        
        let resultData;
        
        if (name === 'mem0_add') {
          resultData = await client.add(args);
        } else if (name === 'mem0_search') {
          resultData = await client.search(args);
        } else if (name === 'mem0_get_all') {
          resultData = await client.getAll(args);
        } else if (name === 'mem0_delete' || name === 'mem0_delete_all') {
          // Double check environment variable protection
          if (process.env.ALLOW_MEM0_DELETE !== 'true') {
            sendError(id, -32602, `Safety Guard: Deletion tool '${name}' is restricted by default. To enable, the environment variable ALLOW_MEM0_DELETE=true must be set.`);
            return;
          }
          
          if (name === 'mem0_delete') {
            resultData = await client.delete(args.memoryId);
          } else {
            resultData = await client.deleteAll(args);
          }
        } else {
          sendError(id, -32601, `Tool not found: ${name}`);
          return;
        }

        sendResponse({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(resultData, null, 2)
              }
            ]
          }
        });
        break;
      }

      default: {
        sendError(id, -32601, `Method not found: ${method}`);
        break;
      }
    }
  } catch (error) {
    console.error(`Error processing method ${method}:`, error.message);
    sendError(id, -32603, error.message);
  }
});

console.error('Mem0 VPS MCP Server started over stdio.');
