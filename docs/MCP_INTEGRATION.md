# MCP Integration Guide

## Overview

The Glass MCP server exposes Glass commands as tools for any MCP-compatible AI assistant (Claude Code, Claude Desktop, etc.).

## Setup

### 1. Install Glass

```bash
npm install -g @glass-framework/cli
```

### 2. Configure MCP

Add to your `.mcp.json` or MCP settings:

```json
{
  "mcpServers": {
    "glass": {
      "command": "glass-mcp-server",
      "args": ["--project", "/path/to/your/glass/project"]
    }
  }
}
```

### 3. Use in Conversations

The AI assistant will automatically have access to Glass tools. Example conversation:

```
User: "Build me a user login system."

AI: [Calls glass_init to create project structure]
AI: [Generates .glass files for auth system]
AI: [Calls glass_verify to check contracts]
AI: [Calls glass_compile to emit code]
AI: [Calls glass_views to generate outlines]
AI: "I've created a login system with 6 units. Here's the verification dashboard..."
```

## Available MCP Tools

| Tool | Description |
|---|---|
| `glass_init` | Initialize a new Glass project |
| `glass_verify` | Run contract verification |
| `glass_compile` | Full compilation pipeline |
| `glass_views` | Generate human-readable views |
| `glass_status` | Verification status dashboard |
| `glass_tree` | Intent hierarchy tree |
| `glass_trace` | Provenance chain for a unit |
| `glass_annotate` | Add annotation to a unit |
| `glass_annotations_list` | List annotations |

## Tool Responses

All tools return structured JSON:

```json
{
  "success": true,
  "data": { ... },
  "summary": "Human-readable summary"
}
```

On failure:

```json
{
  "success": false,
  "error": "Description of what went wrong"
}
```

## Claude Skill Alternative

If MCP is not available, you can use the Claude Skill instead. Copy `.claude/skills/glass/SKILL.md` to your project's `.claude/skills/` directory. This gives Claude knowledge of Glass conventions without requiring the MCP server.
