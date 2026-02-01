#!/usr/bin/env node

/**
 * Glass MCP Server — exposes Glass CLI commands as MCP tools for AI assistants.
 *
 * Conforms to PRD Section 14.2. Configurable via:
 *   { "mcpServers": { "glass": { "command": "glass-mcp-server", "args": ["--project", "./my-project"] } } }
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as path from "path";
import { registerTools } from "./tools";

// Parse --project argument
const args = process.argv.slice(2);
let projectRoot = process.cwd();
const projectIdx = args.indexOf("--project");
if (projectIdx !== -1 && args[projectIdx + 1]) {
  projectRoot = path.resolve(args[projectIdx + 1]);
}

const server = new McpServer(
  { name: "glass-mcp-server", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

registerTools(server, projectRoot);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write("Glass MCP Server error: " + err.message + "\n");
  process.exit(1);
});
