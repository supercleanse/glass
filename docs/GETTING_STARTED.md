# Getting Started with Glass

## Installation

```bash
npm install -g @glass-framework/cli
```

## Quick Start

### 1. Initialize a project

```bash
glass init my-app
cd my-app
```

This creates:
```
my-app/
  manifest.glass          # Living requirements document
  glass.config.json       # Project configuration
  src/glass/              # Your .glass files go here
  dist/                   # Compiled output
  .generated/             # Human-readable views
  .annotations/           # Human annotations
  tests/                  # Test files
```

### 2. Create a .glass file

Create `src/glass/hello.glass`:

```
=== Glass Unit ===
id: app.hello
version: 0.1.0
language: typescript

=== Intent ===
purpose: Greet users by name
source:
  kind: prd
  reference: "Section 1 — User greeting"
parent: null
stakeholder: user
subIntents: []
approvalStatus: approved

=== Contract ===
requires:
  - "name is a non-empty string"
guarantees:
  on_success:
    - "Returns greeting string containing the name"
  on_failure:
    - "Returns default greeting for empty name"
invariants:
  - "Input name is not modified"
fails: []
advisories: []

=== Implementation ===
export function hello(name: string): string {
  if (!name || name.trim().length === 0) {
    return "Hello, World!";
  }
  return "Hello, " + name + "!";
}
```

### 3. Verify

```bash
glass verify
```

Output:
```
+ app.hello: PROVEN (2/2 assertions)
```

### 4. Compile

```bash
glass compile
```

Output:
```
[1/6] Parsing .glass files... done
[2/6] Linking intent tree... done
[3/6] Verifying contracts... done
[4/6] Verifying contracts... done
[5/6] Generating views... done
[6/6] Emitting TypeScript... done

Compilation successful! 1 files emitted
Output: dist/
```

### 5. Use the compiled code

```bash
cd dist
node -e "const { hello } = require('./app/hello'); console.log(hello('Glass'))"
# Hello, Glass!
```

## Next Steps

- Read the [Concepts Guide](./CONCEPTS.md) to understand Glass philosophy
- See the [API Reference](./API_REFERENCE.md) for all commands
- Set up the [MCP Server](./MCP_INTEGRATION.md) for AI assistant integration

## Using with AI Assistants

### Claude Code with MCP

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "glass": {
      "command": "glass-mcp-server",
      "args": ["--project", "./my-app"]
    }
  }
}
```

### Claude Code with Skill

Copy `.claude/skills/glass/SKILL.md` to your project. Claude will automatically understand Glass conventions.
