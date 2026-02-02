# Glass Framework — Source File Conversion Plan

> Task 25.1: Audit All Source Files and Plan .glass Conversion
> Created: 2026-02-01

---

## 1. Complete Source File Inventory

### 1.1 Source Files (26 TypeScript files)

| # | File | Lines | Module | Purpose |
|---|------|-------|--------|---------|
| 1 | `src/index.ts` | 95 | root | Main entry point, re-exports all public API |
| 2 | `src/types/index.ts` | 431 | types | All type definitions (Result, GlassFile, Contract, etc.) |
| 3 | `src/compiler/index.ts` | 80 | compiler | GlassCompiler orchestrator class (stub) |
| 4 | `src/compiler/parser.ts` | 563 | compiler | .glass file parser |
| 5 | `src/compiler/linker.ts` | 130 | compiler | Intent tree linker |
| 6 | `src/compiler/verifier.ts` | 583 | compiler | Contract verifier + instrumentation |
| 7 | `src/compiler/emitter.ts` | 527 | compiler | TypeScript code emitter |
| 8 | `src/compiler/manifest.ts` | 402 | compiler | Manifest parser + ManifestManager |
| 9 | `src/compiler/annotations.ts` | 222 | compiler | Annotation CRUD system |
| 10 | `src/compiler/view-generator.ts` | 544 | compiler | Human-readable view generator |
| 11 | `src/cli/index.ts` | 56 | cli | CLI entry point (Commander.js) |
| 12 | `src/cli/utils.ts` | 77 | cli | Shared CLI utilities (discoverGlassFiles, loadProject) |
| 13 | `src/cli/commands/init.ts` | 93 | cli.commands | `glass init` command |
| 14 | `src/cli/commands/verify.ts` | 65 | cli.commands | `glass verify` command |
| 15 | `src/cli/commands/compile.ts` | 96 | cli.commands | `glass compile` command |
| 16 | `src/cli/commands/views.ts` | 37 | cli.commands | `glass views` command |
| 17 | `src/cli/commands/status.ts` | 72 | cli.commands | `glass status` command |
| 18 | `src/cli/commands/tree.ts` | 65 | cli.commands | `glass tree` command |
| 19 | `src/cli/commands/trace.ts` | 120 | cli.commands | `glass trace` command |
| 20 | `src/cli/commands/eject.ts` | 155 | cli.commands | `glass eject` command |
| 21 | `src/cli/commands/annotate.ts` | 114 | cli.commands | `glass annotate` command |
| 22 | `src/cli/commands/build.ts` | 59 | cli.commands | `glass build` (legacy alias) |
| 23 | `src/cli/commands/audit.ts` | 20 | cli.commands | `glass audit` (placeholder) |
| 24 | `src/adapters/typescript.ts` | 22 | adapters | TypeScript language adapter (placeholder) |
| 25 | `src/mcp/index.ts` | 39 | mcp | MCP server entry point |
| 26 | `src/mcp/tools.ts` | 383 | mcp | MCP tool registrations (10 tools) |

**Total: 26 source files, ~4,449 lines**

### 1.2 Existing .glass Files (already converted)

| File | Glass ID | Status |
|------|----------|--------|
| `src/glass/compiler/compiler.parser.glass` | `compiler.parser` | Complete (full implementation) |
| `src/glass/compiler/compiler.linker.glass` | `compiler.linker` | Complete (full implementation) |
| `src/glass/compiler/compiler.verifier.glass` | `compiler.verifier` | Complete (full implementation) |
| `src/glass/compiler/compiler.emitter.glass` | `compiler.emitter` | Complete (full implementation) |
| `src/glass/manifest.glass` | N/A | Framework manifest (not a Glass unit) |

**Note:** The 4 existing .glass files contain the exact same implementation code as their .ts counterparts. They can serve as the canonical .glass versions — the .ts files become redundant once conversion is complete.

### 1.3 Test Files (11 files, not converted — tests remain .ts)

| File | Lines | Covers |
|------|-------|--------|
| `tests/compiler/parser.test.ts` | ~300 | Parser |
| `tests/compiler/linker.test.ts` | ~200 | Linker |
| `tests/compiler/verifier.test.ts` | ~350 | Verifier |
| `tests/compiler/emitter.test.ts` | ~400 | Emitter |
| `tests/compiler/manifest.test.ts` | ~250 | Manifest |
| `tests/compiler/annotations.test.ts` | ~200 | Annotations |
| `tests/compiler/view-generator.test.ts` | ~400 | View Generator |
| `tests/cli/utils.test.ts` | ~150 | CLI Utilities |
| `tests/mcp/tools.test.ts` | ~250 | MCP Tools |
| `tests/integration/full-pipeline.test.ts` | ~200 | End-to-end pipeline |
| `tests/integration/auth-example.test.ts` | ~200 | Auth example scenario |

**Decision:** Test files remain as `.ts` files. They are consumers of Glass, not Glass units themselves. The Glass compiler verifies `.glass` files; tests verify the compiler works correctly.

### 1.4 Configuration Files (not converted)

- `package.json`, `tsconfig.json`, `jest.config.ts`, `glass.config.json`
- `.eslintrc.json`, `.prettierrc`, `.mcp.json`, `.gitignore`
- `manifest.glass` (root — already Glass format)
- `CLAUDE.md` (project guide)

---

## 2. Conversion Mapping

### 2.1 Target .glass File Paths

| Source (.ts) | Target (.glass) | Glass Unit ID |
|-------------|-----------------|---------------|
| `src/types/index.ts` | `src/types/index.glass` | `types.core` |
| `src/compiler/index.ts` | `src/compiler/index.glass` | `compiler.orchestrator` |
| `src/compiler/parser.ts` | `src/compiler/parser.glass` | `compiler.parser` |
| `src/compiler/linker.ts` | `src/compiler/linker.glass` | `compiler.linker` |
| `src/compiler/verifier.ts` | `src/compiler/verifier.glass` | `compiler.verifier` |
| `src/compiler/emitter.ts` | `src/compiler/emitter.glass` | `compiler.emitter` |
| `src/compiler/manifest.ts` | `src/compiler/manifest.glass` | `compiler.manifest` |
| `src/compiler/annotations.ts` | `src/compiler/annotations.glass` | `compiler.annotations` |
| `src/compiler/view-generator.ts` | `src/compiler/view-generator.glass` | `compiler.view_generator` |
| `src/cli/index.ts` | `src/cli/index.glass` | `cli.entry` |
| `src/cli/utils.ts` | `src/cli/utils.glass` | `cli.utils` |
| `src/cli/commands/init.ts` | `src/cli/commands/init.glass` | `cli.cmd_init` |
| `src/cli/commands/verify.ts` | `src/cli/commands/verify.glass` | `cli.cmd_verify` |
| `src/cli/commands/compile.ts` | `src/cli/commands/compile.glass` | `cli.cmd_compile` |
| `src/cli/commands/views.ts` | `src/cli/commands/views.glass` | `cli.cmd_views` |
| `src/cli/commands/status.ts` | `src/cli/commands/status.glass` | `cli.cmd_status` |
| `src/cli/commands/tree.ts` | `src/cli/commands/tree.glass` | `cli.cmd_tree` |
| `src/cli/commands/trace.ts` | `src/cli/commands/trace.glass` | `cli.cmd_trace` |
| `src/cli/commands/eject.ts` | `src/cli/commands/eject.glass` | `cli.cmd_eject` |
| `src/cli/commands/annotate.ts` | `src/cli/commands/annotate.glass` | `cli.cmd_annotate` |
| `src/cli/commands/build.ts` | `src/cli/commands/build.glass` | `cli.cmd_build` |
| `src/cli/commands/audit.ts` | `src/cli/commands/audit.glass` | `cli.cmd_audit` |
| `src/adapters/typescript.ts` | `src/adapters/typescript.glass` | `adapters.typescript` |
| `src/mcp/index.ts` | `src/mcp/index.glass` | `mcp.server` |
| `src/mcp/tools.ts` | `src/mcp/tools.glass` | `mcp.tools` |
| `src/index.ts` | `src/index.glass` | `glass.entry` |

**Note on existing .glass files:** The files currently in `src/glass/compiler/` will be relocated to `src/compiler/` as part of conversion. The `src/glass/` directory was a staging area during bootstrap and will be removed.

### 2.2 Conversion Priority Order

Conversion must respect the dependency graph (foundational units first):

**Phase A — Foundation (no dependencies)**
1. `types.core` — All type definitions used by every other unit
2. `compiler.orchestrator` — GlassCompiler class (stub, simple)

**Phase B — Compiler Core (depends on types.core)**
3. `compiler.parser` — Already exists as .glass
4. `compiler.linker` — Already exists as .glass
5. `compiler.verifier` — Already exists as .glass
6. `compiler.emitter` — Already exists as .glass (depends on verifier)
7. `compiler.manifest` — Manifest parsing and management
8. `compiler.annotations` — Annotation CRUD
9. `compiler.view_generator` — View generation

**Phase C — CLI Infrastructure (depends on compiler)**
10. `cli.utils` — Shared utilities (loadProject, discoverGlassFiles)
11. `cli.entry` — CLI entry point (registers commands)

**Phase D — CLI Commands (depends on cli.utils + compiler)**
12. `cli.cmd_init`
13. `cli.cmd_verify`
14. `cli.cmd_compile`
15. `cli.cmd_views`
16. `cli.cmd_status`
17. `cli.cmd_tree`
18. `cli.cmd_trace`
19. `cli.cmd_eject`
20. `cli.cmd_annotate`
21. `cli.cmd_build`
22. `cli.cmd_audit`

**Phase E — Adapters & MCP (depends on compiler)**
23. `adapters.typescript`
24. `mcp.tools`
25. `mcp.server`

**Phase F — Root Entry**
26. `glass.entry` — Main entry point (re-exports everything)

---

## 3. Intent Hierarchy Design

### 3.1 Complete Intent Tree

```
glass.framework (root)
  purpose: "Provide AI-first development framework with formal verification"
  source: prd
  stakeholder: product
  │
  ├── glass.entry
  │     purpose: "Export the public Glass API"
  │     source: prd, "PRD Section 12"
  │     stakeholder: engineering
  │
  ├── types.core
  │     purpose: "Define all Glass type definitions including Result<T,E>"
  │     source: prd, "PRD Sections 4, 8, 9"
  │     stakeholder: engineering
  │
  ├── glass.compiler
  │     purpose: "Compile .glass files through the parse-link-verify-emit pipeline"
  │     source: prd, "PRD Section 11"
  │     stakeholder: engineering
  │     │
  │     ├── compiler.orchestrator
  │     │     purpose: "Orchestrate the full compilation pipeline"
  │     │     source: prd, "PRD Section 11.1"
  │     │     stakeholder: engineering
  │     │
  │     ├── compiler.parser
  │     │     purpose: "Parse .glass files into structured GlassFile objects"
  │     │     source: prd, "PRD Section 4 and 11.1 step 1"
  │     │     stakeholder: engineering
  │     │
  │     ├── compiler.linker
  │     │     purpose: "Build and validate the intent tree from parsed .glass files"
  │     │     source: prd, "PRD Section 11.1 step 2"
  │     │     stakeholder: engineering
  │     │
  │     ├── compiler.verifier
  │     │     purpose: "Verify implementations satisfy their contracts"
  │     │     source: prd, "PRD Section 9"
  │     │     stakeholder: engineering
  │     │
  │     ├── compiler.emitter
  │     │     purpose: "Output clean TypeScript from verified .glass files"
  │     │     source: prd, "PRD Section 11.1 step 6"
  │     │     stakeholder: engineering
  │     │
  │     ├── compiler.manifest
  │     │     purpose: "Parse, manage, and serialize manifest.glass files"
  │     │     source: prd, "PRD Section 5"
  │     │     stakeholder: engineering
  │     │
  │     ├── compiler.annotations
  │     │     purpose: "Manage human annotations on Glass units"
  │     │     source: prd, "PRD Section 7"
  │     │     stakeholder: user
  │     │
  │     └── compiler.view_generator
  │           purpose: "Generate human-readable views from Glass units"
  │           source: prd, "PRD Section 6"
  │           stakeholder: user
  │
  ├── glass.cli
  │     purpose: "Provide command-line interface for Glass operations"
  │     source: prd, "PRD Section 12"
  │     stakeholder: user
  │     │
  │     ├── cli.entry
  │     │     purpose: "Register and dispatch CLI commands"
  │     │     source: prd, "PRD Section 12"
  │     │     stakeholder: engineering
  │     │
  │     ├── cli.utils
  │     │     purpose: "Provide shared utilities for CLI commands"
  │     │     source: ai-generated, "Common functionality extracted from CLI commands"
  │     │     stakeholder: engineering
  │     │
  │     ├── cli.cmd_init
  │     │     purpose: "Initialize a new Glass project"
  │     │     source: prd, "PRD Section 12 — glass init"
  │     │     stakeholder: user
  │     │
  │     ├── cli.cmd_verify
  │     │     purpose: "Run contract verification on Glass files"
  │     │     source: prd, "PRD Section 12 — glass verify"
  │     │     stakeholder: user
  │     │
  │     ├── cli.cmd_compile
  │     │     purpose: "Run the full compilation pipeline"
  │     │     source: prd, "PRD Section 12 — glass compile"
  │     │     stakeholder: user
  │     │
  │     ├── cli.cmd_views
  │     │     purpose: "Generate human-readable views"
  │     │     source: prd, "PRD Section 12 — glass views"
  │     │     stakeholder: user
  │     │
  │     ├── cli.cmd_status
  │     │     purpose: "Display verification status dashboard"
  │     │     source: prd, "PRD Section 12 — glass status"
  │     │     stakeholder: user
  │     │
  │     ├── cli.cmd_tree
  │     │     purpose: "Display intent hierarchy tree"
  │     │     source: prd, "PRD Section 12 — glass tree"
  │     │     stakeholder: user
  │     │
  │     ├── cli.cmd_trace
  │     │     purpose: "Show provenance chain for a Glass unit"
  │     │     source: prd, "PRD Section 12 — glass trace"
  │     │     stakeholder: user
  │     │
  │     ├── cli.cmd_eject
  │     │     purpose: "Eject Glass project to standalone TypeScript"
  │     │     source: prd, "PRD Section 12 — glass eject"
  │     │     stakeholder: user
  │     │
  │     ├── cli.cmd_annotate
  │     │     purpose: "Add human annotations to Glass units"
  │     │     source: prd, "PRD Section 12 — glass annotate"
  │     │     stakeholder: user
  │     │
  │     ├── cli.cmd_build
  │     │     purpose: "Legacy compile command alias"
  │     │     source: ai-generated, "Backward compatibility"
  │     │     stakeholder: engineering
  │     │
  │     └── cli.cmd_audit
  │           purpose: "Display audit trail"
  │           source: prd, "PRD Section 12 — glass audit"
  │           stakeholder: security
  │
  ├── glass.adapters
  │     purpose: "Provide language-specific compilation adapters"
  │     source: prd, "PRD Section 13"
  │     stakeholder: engineering
  │     │
  │     └── adapters.typescript
  │           purpose: "Translate Glass contracts into TypeScript constructs"
  │           source: prd, "PRD Section 13"
  │           stakeholder: engineering
  │
  └── glass.mcp
        purpose: "Expose Glass CLI as MCP tools for AI assistants"
        source: prd, "PRD Section 14"
        stakeholder: engineering
        │
        ├── mcp.server
        │     purpose: "Initialize MCP server with stdio transport"
        │     source: prd, "PRD Section 14"
        │     stakeholder: engineering
        │
        └── mcp.tools
              purpose: "Register Glass operations as MCP tools"
              source: prd, "PRD Section 14"
              stakeholder: engineering
```

### 3.2 Intent Hierarchy Statistics

| Level | Count | Description |
|-------|-------|-------------|
| Root | 1 | `glass.framework` |
| L1 (virtual parents) | 5 | `glass.entry`, `types.core`, `glass.compiler`, `glass.cli`, `glass.adapters`, `glass.mcp` |
| L2 (concrete units) | 26 | All source file units |
| **Total** | **32** | 6 virtual parents + 26 concrete units |

**Note on virtual parents:** `glass.framework`, `glass.compiler`, `glass.cli`, `glass.adapters`, and `glass.mcp` are organizational intents that group related units. They do not have their own `.glass` files — they exist only in the intent hierarchy to provide structure. The `glass.entry` and `types.core` units are both L1 children of `glass.framework` AND have concrete implementations.

For self-compilation, the virtual parent intents can be represented as `.glass` files with empty implementations, or they can be implied by the intent tree structure. **Recommended approach:** Use them as organizational nodes only; don't create .glass files for them.

---

## 4. Proposed Contract Outlines

### 4.1 Foundation

#### `types.core`
- **requires:** None (pure type definitions)
- **guarantees:** All types compile without errors; Result<T,E> provides Ok/Err constructors; all PRD concepts are represented
- **invariants:** Types are readonly where appropriate; no runtime side effects
- **fails:** None (compile-time only)

#### `compiler.orchestrator`
- **requires:** Valid CompilerOptions; source paths are valid .glass files
- **guarantees:** Returns CompilationResult with diagnostics; runs pipeline in correct order (parse → link → verify → emit)
- **invariants:** Pipeline stages are idempotent; source files never modified
- **fails:** CompilationFailed (wraps stage-specific errors)

### 4.2 Compiler Core (already drafted in existing .glass files)

The 4 existing `.glass` files (`compiler.parser`, `compiler.linker`, `compiler.verifier`, `compiler.emitter`) already have complete contracts. See `src/glass/compiler/`.

#### `compiler.manifest`
- **requires:** File path or content string; valid manifest format
- **guarantees:** Returns Manifest with all fields parsed; serialization round-trips correctly
- **invariants:** ManifestManager is stateless between operations
- **fails:** FileNotFound, InvalidFormat, MissingField, InvalidVersion

#### `compiler.annotations`
- **requires:** Valid annotationsDir path; valid unitId; valid target format
- **guarantees:** Annotation persisted to JSON file; unique IDs generated; resolve/delete are idempotent
- **invariants:** Annotation files are unit-scoped; resolved annotations persist
- **fails:** UnitNotFound, AnnotationNotFound, InvalidTarget, WriteError

#### `compiler.view_generator`
- **requires:** Valid GlassFile array; valid IntentTree; valid VerificationResults
- **guarantees:** Generates per-unit views + aggregate views; all views are valid markdown
- **invariants:** Views are read-only (never modify source); generation is deterministic
- **fails:** WriteError, InvalidInput

### 4.3 CLI

#### `cli.utils`
- **requires:** Valid directory path
- **guarantees:** discoverGlassFiles returns all .glass files recursively; loadProject returns parsed/linked/verified context
- **invariants:** Discovery excludes node_modules, .generated, manifest.glass
- **fails:** Directory not found; parse/link/verify errors propagated

#### `cli.entry`
- **requires:** Valid Node.js process with argv
- **guarantees:** All commands registered; version/help available; errors produce non-zero exit code
- **invariants:** Command registration is deterministic
- **fails:** Unknown command; missing arguments

#### CLI Commands (shared pattern)
- **requires:** Valid Glass project (glass.config.json exists); source directory contains .glass files
- **guarantees:** Command-specific output (see individual commands); exit code 0 on success, 1 on failure
- **invariants:** Commands are side-effect-free except for documented outputs
- **fails:** ProjectNotFound; VerificationFailed; WriteError (for commands that write)

### 4.4 Adapters & MCP

#### `adapters.typescript`
- **requires:** Valid GlassFile with language: typescript
- **guarantees:** Returns compiled output
- **invariants:** Adapter is stateless
- **fails:** CompilationFailed

#### `mcp.server`
- **requires:** Valid --project argument; stdio transport available
- **guarantees:** MCP server starts; all tools registered; responds to tool calls
- **invariants:** One server per process
- **fails:** InvalidProjectPath; TransportError

#### `mcp.tools`
- **requires:** Valid McpServer instance; valid projectRoot
- **guarantees:** All 10 tools registered with schemas; each tool returns { success, data, summary }
- **invariants:** Tool registration is idempotent; schemas match implementation
- **fails:** ToolRegistrationFailed; tool-specific errors wrapped

---

## 5. Dependency Graph

### 5.1 Module Dependencies (import direction →)

```
types/index.ts
  ↑ imported by: ALL compiler, cli, and mcp modules

compiler/parser.ts → types/index
compiler/linker.ts → types/index
compiler/verifier.ts → types/index
compiler/emitter.ts → types/index, compiler/verifier (InstrumentationPlan)
compiler/manifest.ts → types/index
compiler/annotations.ts → types/index
compiler/view-generator.ts → types/index
compiler/index.ts → types/index

cli/utils.ts → compiler/parser, compiler/linker, compiler/verifier, types/index
cli/commands/*.ts → cli/utils, compiler/*, chalk, commander
cli/index.ts → cli/commands/*, src/index (VERSION), commander

mcp/tools.ts → cli/utils, compiler/*, types/index, zod, @modelcontextprotocol/sdk
mcp/index.ts → mcp/tools, @modelcontextprotocol/sdk

src/index.ts → compiler/*, types/index
```

### 5.2 Cross-Module Import (emitter → verifier)

The **only** cross-compiler-module dependency is:
- `compiler/emitter.ts` imports `InstrumentationPlan` from `compiler/verifier.ts`

This is a clean, unidirectional dependency. No circular references.

### 5.3 External Dependencies Used in Source

| Package | Used In | In package.json? |
|---------|---------|-------------------|
| `fs`, `path` (Node built-ins) | parser, emitter, manifest, annotations, view-generator, cli/*, mcp | N/A |
| `commander` | cli/index, cli/commands/* | Yes |
| `chalk` | cli/commands/* | Yes |
| `@modelcontextprotocol/sdk` | mcp/index, mcp/tools | Yes |
| `zod` | mcp/tools | **NO — MISSING** |

**Action required:** Add `zod` to `package.json` dependencies.

---

## 6. Risk Assessment

### 6.1 High Risk

| Risk | Details | Mitigation |
|------|---------|------------|
| **Parser self-reference** | The Glass parser must parse itself as a .glass file. If the parser's own implementation uses patterns the parser can't handle (e.g., complex regex, template literals spanning sections), self-compilation will fail. | Test parser.glass through the parser early. The existing `src/glass/compiler/compiler.parser.glass` already validates this. |
| **Import path rewriting** | Converting `.ts` imports to `.glass` requires all imports to resolve correctly during compilation. The emitter must rewrite `.glass` references back to `.ts`. | Verify the emitter handles this. Current emitter uses `mapGlassIdToPath` which maps IDs to paths — imports within .glass implementations still use relative `.ts` paths pointing to siblings. |

### 6.2 Medium Risk

| Risk | Details | Mitigation |
|------|---------|------------|
| **Large files** | `compiler/verifier.ts` (583 lines) and `compiler/parser.ts` (563 lines) are the largest. The parser may have performance issues parsing very large implementation sections. | The parser treats the Implementation section as a raw string pass-through — size shouldn't matter. Monitor memory during self-compilation. |
| **Backward-compat stubs** | Four files (`parser.ts`, `linker.ts`, `verifier.ts`, `emitter.ts`) have backward-compat `parse()`/`link()`/`verify()`/`emit()` stub functions. These should be removed during conversion. | Remove stubs in .glass versions. Update any code that calls them (none found — they appear unused). |
| **GlassCompiler stub** | `src/compiler/index.ts` is a stub class that doesn't actually run the pipeline. It needs a real implementation for self-compilation. | Either implement the full orchestrator or convert with the stub and note it as a Phase 2 enhancement. The CLI commands already implement the pipeline directly via `loadProject()`. |
| **Missing zod dependency** | `mcp/tools.ts` imports `zod` but it's not in `package.json`. | Add to dependencies before conversion. |

### 6.3 Low Risk

| Risk | Details | Mitigation |
|------|---------|------------|
| **No circular dependencies** | Confirmed — the module graph is a clean DAG. | No action needed. |
| **Placeholder files** | `adapters/typescript.ts` (22 lines, placeholder) and `cli/commands/audit.ts` (20 lines, placeholder) have minimal implementations. | Convert as-is with contracts noting placeholder status via advisories. |
| **Test compatibility** | Tests import from `.ts` files. After conversion, tests must import from the compilation output or be updated. | Tests should continue importing from `src/index.ts` (the root re-export). During development, `ts-node` can handle .glass → .ts resolution if the build pipeline generates .ts intermediates. |

### 6.4 Files That May Need Splitting

None identified. All files are reasonably sized (< 600 lines) and have single responsibilities. The `compiler/verifier.ts` could theoretically be split into separate verification method modules, but it's cohesive enough to remain as one unit.

---

## 7. Existing .glass Files — Reuse Strategy

The 4 existing `.glass` files in `src/glass/compiler/` are ready for use:

| File | Action |
|------|--------|
| `compiler.parser.glass` | Move from `src/glass/compiler/` to `src/compiler/parser.glass`. Update parent intent from `null` to `glass.compiler`. |
| `compiler.linker.glass` | Move from `src/glass/compiler/` to `src/compiler/linker.glass`. Update parent intent from `null` to `glass.compiler`. |
| `compiler.verifier.glass` | Move from `src/glass/compiler/` to `src/compiler/verifier.glass`. Update parent intent from `null` to `glass.compiler`. |
| `compiler.emitter.glass` | Move from `src/glass/compiler/` to `src/compiler/emitter.glass`. Update parent intent from `null` to `glass.compiler`. |

Changes needed for each:
1. Update `parent: null` → `parent: glass.compiler`
2. Remove backward-compat stub functions from Implementation section
3. Verify implementation matches the current `.ts` file (diff check)
4. Delete the original `.ts` file after verification

---

## 8. Manifest Update Plan

The root `manifest.glass` needs updating to reflect the full framework:

```
Glass Manifest: GlassFramework
Version: 0.1.0
Language: TypeScript
Created: 2026-02-01

Origins:
  PRD: "Glass Framework Specification v0.1.0"
    authored by user, 2026-02-01
  Development: "Bootstrap phase implementation"
    Tasks 1-25 via Taskmaster MCP, 2026-02-01

Policies:
  auto-approve: security, audit, infrastructure
  require-approval: framework-behavior, compiler-semantics

Intent Registry:
  user-originated: 26 intents
  development-derived: 4 intents
  ai-generated: 2 intents
```

---

## 9. Summary Statistics

| Metric | Count |
|--------|-------|
| Total .ts files to convert | 26 |
| Already have .glass versions | 4 |
| New .glass files to create | 22 |
| Total Glass units | 26 |
| Virtual parent intents | 5 |
| Total intent tree nodes | 31 |
| Estimated conversion phases | 6 (A-F) |
