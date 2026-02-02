# Glass Framework

AI writes the code. Humans review structured outlines. The compiler guarantees the contracts are satisfied.

Glass is a framework for AI-first software development. Every unit of code has three sections: **Intent** (why it exists), **Contract** (what it promises), and **Implementation** (the code). The Glass compiler parses `.glass` source files, links them into an intent hierarchy, verifies that implementations satisfy their contracts, and emits target-language code.

Glass is self-hosting: the compiler verifies and compiles itself. All 32 units are **PROVEN**.

## Why Glass?

### The Problem

AI writes code faster than humans can review it. A single prompt can generate hundreds of lines across multiple files. Teams using AI coding tools face a new challenge: **how do you know the AI built what you asked for?**

Today, the answer is "read all the code." That doesn't scale. Code review becomes a bottleneck. Bugs hide in the gap between what was requested and what was generated. There's no systematic way to verify that AI-generated code actually does what it's supposed to do.

### The Approach

Glass adds a verification layer between intent and implementation:

1. **You describe what you want** -- in conversation, a PRD, or annotations
2. **AI writes the code** -- with an explicit contract declaring what the code promises
3. **The compiler proves it** -- statically verifying that the implementation satisfies its contract
4. **You review outlines, not code** -- structured summaries of intent, contracts, and verification status

The human never needs to read implementation code. You review *what* the system promises, not *how* it does it. The compiler handles the "how" verification.

### What You Get

**Full traceability.** Every line of code traces back to a stated purpose. Every requirement links to its source -- whether that's a PRD, a conversation, or an AI-generated security measure. Run `glass trace` on any unit and see the full chain from business goal to implementation.

**Verified contracts.** The compiler doesn't just check types -- it proves that functions return what they promise, handle the errors they declare, and maintain their invariants. 288 assertions across 32 units, all statically verified.

**Human-readable dashboards.** The `glass-views/` directory contains auto-generated outlines: intent trees, contract summaries, verification checklists, and a business-level view. Readable by anyone, technical or not.

**Eject anytime.** Run `glass eject` and get clean, standalone TypeScript with zero Glass dependencies. No vendor lock-in. The `dist/` output deploys to any platform -- Cloudflare, AWS, Vercel, Docker, anywhere.

**Audit trail.** Every intent records who requested it, where the requirement came from, and whether it was human-originated, conversation-derived, or AI-generated. Built for teams that need compliance and accountability.

### Who It's For

- **Teams using AI to write code** who need confidence that the AI built what was asked for
- **Engineering leads** who want to review AI output without reading every line
- **Enterprises** that need audit trails, traceability, and formal verification for AI-generated code
- **Security-conscious organizations** where every piece of code must link to a stated requirement
- **Anyone building with AI** who wants the productivity gains without giving up control

## Quick Start

```bash
# Clone and install
git clone https://github.com/supercleanse/glass.git
cd glass
npm install

# Build the compiler
npm run build

# Verify all contracts (runs AST-based verification)
npx glass verify --source src/

# Compile .glass files to TypeScript
npx glass compile --source src/

# See the intent hierarchy
npx glass tree --source src/

# Check verification status dashboard
npx glass status --source src/
```

### Start a New Project

```bash
npx glass init my-project
cd my-project
```

This creates a project with `manifest.glass`, `glass.config.json`, and the standard directory structure.

## How It Works

### The .glass File Format

Every `.glass` file has three sections:

```
=== Glass Unit ===
id: compiler.parser
version: 0.1.0
language: typescript

=== Intent ===
purpose: Parse .glass source files into structured GlassFile objects
source:
  kind: prd
  reference: "PRD Section 8"
parent: glass.compiler
stakeholder: engineering
subIntents: []
approvalStatus: approved

=== Contract ===
requires:
  - "filePath points to a readable .glass file"

guarantees:
  on_success:
    - "Returns a GlassFile with all sections parsed"
    - "parseGlassFile returns Result<GlassFile, ParseError>"
  on_failure:
    - "Returns ParseError with line number and reason"

invariants:
  - "Source files are never modified"
  - "Parsing is deterministic"

fails:
  MalformedHeader: "Returns ParseError with reason MalformedHeader"
  MissingSections: "Returns ParseError with reason MissingSections"

advisories:

=== Implementation ===
// TypeScript code here
```

**Intent** declares *why* the code exists, who it's for, and where the requirement came from. Intents form a tree: every unit has a parent, and the tree traces from business goals down to individual functions.

**Contract** declares *what* the code promises. Preconditions (`requires`), postconditions (`guarantees`), properties that always hold (`invariants`), error handling (`fails`), and decisions flagged for human review (`advisories`).

**Implementation** is the actual code. The compiler verifies it satisfies the contract.

### Compiler Pipeline

```
.glass files  -->  Parse  -->  Link  -->  Verify  -->  Generate Views  -->  Emit .ts
```

1. **Parse** -- Reads `.glass` files and extracts Intent, Contract, and Implementation sections
2. **Link** -- Builds the intent hierarchy tree and checks for dangling references
3. **Verify** -- Proves implementations satisfy contracts using TypeScript AST analysis
4. **Generate Views** -- Creates human-readable outlines, checklists, and dashboards
5. **Emit** -- Outputs target-language source files (TypeScript)

### Verification

The verifier has two phases:

**Phase 1 (Pattern Matching)** -- Regex-based checks on implementation text. Used as a fallback.

**Phase 2 (AST Analysis)** -- Uses the TypeScript Compiler API to create a `ts.Program` with type checker. Proves assertions by inspecting actual function signatures, return types, parameter types, AST traversal of error handling, and data flow analysis.

Verification levels:

| Level | Meaning |
|---|---|
| **PROVEN** | Statically verified by the compiler |
| **INSTRUMENTED** | Runtime checks will be injected |
| **TESTED** | Verified through generated tests |
| **UNVERIFIABLE** | Requires human review |

A unit passes verification when all its assertions pass. The overall status is **PROVEN** if every assertion passes.

### Self-Hosting

Glass compiles and verifies itself. The 32 `.glass` files in `src/` *are* the source code. Running `glass compile --source src/` emits the TypeScript files to `dist/`, and those compiled files can then verify and compile the `.glass` source again -- producing byte-identical output (idempotent).

```bash
# The compiler verifies itself
npx glass verify --source src/
# Summary: 32/32 units verified

# The compiler compiles itself
npx glass compile --source src/
# Compilation successful! 32 files emitted
```

## CLI Reference

### `glass init <name>`

Initialize a new Glass project.

```
Arguments:
  name                     Project name

Options:
  -l, --language <lang>    Target language: typescript | rust  (default: "typescript")
  --no-git                 Skip git initialization
```

### `glass verify`

Run contract verification on all `.glass` files.

```
Options:
  -s, --source <dir>       Source directory  (default: "src")
  --failures-only          Show only failed units
  -v, --verbose            Show detailed failure messages
```

Example:

```bash
# Verify all units
npx glass verify --source src/

# Show only failures with details
npx glass verify --source src/ --failures-only -v
```

### `glass compile`

Full compilation pipeline: parse, link, verify, generate views, emit.

```
Options:
  -s, --source <dir>       Source directory  (default: "src")
  -o, --output <dir>       Output directory  (default: "dist")
  --no-verify              Skip verification step
  --clean                  Clean output directory before emitting
  -v, --verbose            Enable verbose output
```

Example:

```bash
# Compile with verification
npx glass compile --source src/

# Compile without verification (faster)
npx glass compile --source src/ --no-verify

# Clean build
npx glass compile --source src/ --clean
```

### `glass status`

Display verification status dashboard.

```
Options:
  -s, --source <dir>       Source directory  (default: "src")
```

### `glass tree`

Display the intent hierarchy tree.

```
Options:
  -s, --source <dir>       Source directory  (default: "src")
  -d, --depth <n>          Maximum tree depth
```

### `glass trace <unitId>`

Show the full provenance chain for a unit -- from business goal to implementation.

```
Arguments:
  unitId                   Glass unit ID to trace

Options:
  -s, --source <dir>       Source directory  (default: "src")
  -c, --contracts          Show contracts at each level
```

Example:

```bash
# Trace a unit's provenance
npx glass trace compiler.parser --source src/

# With contracts at each level
npx glass trace compiler.parser --source src/ -c
```

### `glass views`

Generate human-readable views and dashboards.

```
Options:
  -s, --source <dir>       Source directory  (default: "src")
  -o, --output <dir>       Output directory  (default: "glass-views")
```

Output includes:
- Per-unit intent, contract, and verification views
- Master intent outline
- Master contract outline
- Verification dashboard
- Business view

### `glass annotate <unitId> <target> <note>`

Add human annotations to generated outlines. Annotations are stored separately from source files and survive recompilation.

```
Arguments:
  unitId                   Glass unit ID
  target                   Target: "line:<n>" or dotted path
  note                     Annotation text

Options:
  --author <name>          Annotation author  (default: "human")
  --resolve <id>           Resolve an annotation by ID
  --list                   List all annotations for the unit
  --unresolved             List all unresolved annotations
```

Example:

```bash
# Add an annotation
npx glass annotate compiler.parser "contract.guarantees.success.1" "Should this also handle .ts files?"

# List annotations
npx glass annotate compiler.parser --list

# List all unresolved annotations
npx glass annotate --unresolved
```

### `glass eject`

Eject to standalone TypeScript with no Glass dependencies.

```
Options:
  -o, --output <dir>       Output directory  (default: "ejected")
  --dist <dir>             Compiled dist directory  (default: "dist")
  --keep-source            Keep original Glass source files
  --force                  Skip confirmation prompt
```

### `glass audit`

Display the audit trail for Glass units.

```
Options:
  -u, --unit <id>          Show audit for a specific unit
  -v, --verbose            Show detailed audit information
```

### `glass build`

Legacy alias for `compile`.

## Project Structure

```
glass/
├── manifest.glass              # Living requirements document
├── glass.config.json           # Project configuration
├── src/
│   ├── index.glass             # Public API entry point
│   ├── types/
│   │   └── index.glass         # Type definitions
│   ├── compiler/
│   │   ├── index.glass         # Compiler orchestrator
│   │   ├── parser.glass        # .glass file parser
│   │   ├── linker.glass        # Intent tree linker
│   │   ├── verifier.glass      # Contract verifier (Phase 1 + 2)
│   │   ├── ast-verifier.glass  # AST-based verification functions
│   │   ├── ts-program-factory.glass  # TypeScript Program creation
│   │   ├── emitter.glass       # TypeScript code emitter
│   │   ├── manifest.glass      # Manifest parser
│   │   ├── annotations.glass   # Annotation management
│   │   └── view-generator.glass # View/dashboard generation
│   ├── cli/
│   │   ├── index.glass         # CLI entry point
│   │   ├── utils.glass         # Shared CLI utilities
│   │   └── commands/           # Individual CLI commands
│   ├── adapters/
│   │   └── typescript.glass    # TypeScript language adapter
│   └── mcp/
│       ├── index.glass         # MCP server entry point
│       └── tools.glass         # MCP tool registrations
├── glass-views/                # Auto-generated views (never hand-edit)
│   ├── units/                  # Per-unit intent, contract, verification views
│   ├── master-intent-outline.md
│   ├── master-contract-outline.md
│   ├── verification-dashboard.md
│   └── business-view.md
├── annotations/                # Human annotations
├── dist/                       # Compiled TypeScript output
└── tests/                      # Test suite
```

## Using with AI Assistants

Glass is designed to be used with AI. There are three ways to integrate, from simplest to most powerful.

### Option 1: Claude Skill (Recommended for Claude Code)

The Claude Skill teaches Claude how to work with Glass projects. When the skill is loaded, Claude automatically generates `.glass` files, maintains the manifest, writes proper contracts, and follows Glass methodology without being reminded.

**Setup for a new project:**

```bash
# Initialize your project
npx glass init my-project
cd my-project

# Create the skill directory and copy the skill file
mkdir -p .claude/skills/glass
cp /path/to/glass/.claude/skills/glass/SKILL.md .claude/skills/glass/SKILL.md
```

**Setup for an existing Glass project (like this repo):**

The skill file is already at `.claude/skills/glass/SKILL.md`. Claude Code picks it up automatically when working in this directory.

**What the skill does:**

When Claude has the skill loaded, it will:

1. Generate `.glass` files instead of raw `.ts` files
2. Always include Intent, Contract, and Implementation sections
3. Update `manifest.glass` when adding or removing units
4. Write proper contracts with requires, guarantees, invariants, and fails
5. Use the correct intent hierarchy (parent references, sub-intents)
6. Run `glass verify` and `glass compile` to check its work
7. Present generated views for human review

**Example conversation with the skill active:**

```
You:    "Add a user authentication module"

Claude: [Creates auth.glass with intent, contract, and implementation]
        [Updates manifest.glass with new unit]
        [Runs glass verify to check contracts]
        [Runs glass compile to emit TypeScript]
        "I've created auth.glass with 3 guarantees and 2 failure modes.
         All assertions PROVEN. Here's the contract outline for review..."
```

**Skill file location:**

```
your-project/
└── .claude/
    └── skills/
        └── glass/
            └── SKILL.md    # Claude reads this automatically
```

### Option 2: MCP Server (For Any MCP-Compatible AI)

The Glass MCP server exposes all commands as tools that any MCP-compatible AI assistant can call programmatically.

**Setup for Claude Code:**

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "glass": {
      "command": "npx",
      "args": ["glass-mcp-server", "/path/to/your/project"]
    }
  }
}
```

**Setup for Claude Desktop:**

Add to your Claude Desktop MCP settings:

```json
{
  "mcpServers": {
    "glass": {
      "command": "npx",
      "args": ["glass-mcp-server", "/path/to/your/project"]
    }
  }
}
```

**Available MCP tools:**

| Tool | Description |
|---|---|
| `glass_init` | Initialize a new Glass project |
| `glass_verify` | Run contract verification, return results as JSON |
| `glass_compile` | Full compilation pipeline |
| `glass_views` | Generate human-readable views |
| `glass_status` | Verification status dashboard |
| `glass_tree` | Intent hierarchy tree |
| `glass_trace` | Provenance chain for a unit |
| `glass_annotate` | Add annotation to a unit |
| `glass_annotations_list` | List annotations |

All tools return structured JSON:

```json
{
  "success": true,
  "data": { "allPassed": true, "totalUnits": 32 },
  "summary": "All units verified successfully"
}
```

### Option 3: CLI Only (Any Workflow)

Use the `glass` CLI directly in your terminal or CI pipeline. No AI integration required.

```bash
npx glass init my-project
npx glass verify --source src/
npx glass compile --source src/
```

### Using Both Skill + MCP Together

For the best experience with Claude Code, use both:

- The **Skill** gives Claude knowledge of Glass conventions (how to write `.glass` files, contracts, intents)
- The **MCP server** gives Claude tools to run verification and compilation directly

```
your-project/
├── .claude/
│   └── skills/
│       └── glass/
│           └── SKILL.md        # Glass methodology knowledge
├── .mcp.json                   # MCP server configuration
├── manifest.glass
├── glass.config.json
└── src/
    └── *.glass
```

## Configuration

`glass.config.json` in the project root:

```json
{
  "version": "0.1.0",
  "language": "typescript",
  "projectName": "my-project",
  "outputDir": "dist",
  "generatedDir": "glass-views",
  "annotationsDir": "annotations"
}
```

## Intent Hierarchy

Every Glass unit declares a `parent` in its Intent section. This forms a tree that traces from high-level business goals down to individual implementation units.

```
glass.framework
├── types.core
├── glass.entry
├── glass.compiler
│   ├── compiler.orchestrator
│   ├── compiler.parser
│   ├── compiler.linker
│   ├── compiler.verifier
│   ├── compiler.ast_verifier
│   ├── compiler.ts_program_factory
│   ├── compiler.emitter
│   ├── compiler.manifest
│   ├── compiler.annotations
│   └── compiler.view_generator
├── glass.cli
│   ├── cli.entry
│   ├── cli.utils
│   ├── cli.cmd_init
│   ├── cli.cmd_verify
│   ├── cli.cmd_compile
│   ├── cli.cmd_views
│   ├── cli.cmd_status
│   ├── cli.cmd_tree
│   ├── cli.cmd_trace
│   ├── cli.cmd_eject
│   ├── cli.cmd_annotate
│   ├── cli.cmd_build
│   └── cli.cmd_audit
├── glass.adapters
│   └── adapters.typescript
└── glass.mcp
    ├── mcp.server
    └── mcp.tools
```

Use `glass tree` to view this hierarchy and `glass trace <unitId>` to see the full provenance chain from root to any unit.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Verify contracts
npx glass verify --source src/

# Full compile (verify + emit + views)
npx glass compile --source src/

# Lint
npm run lint
```

## Requirements

- Node.js >= 18.0.0
- TypeScript >= 5.5.0

## License

MIT
