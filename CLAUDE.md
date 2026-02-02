# CLAUDE.md — Glass Framework

## Project Overview

Glass is a framework for AI-first software development where AI writes all code, humans review structured outlines, and a compiler guarantees the implementation satisfies its contracts.

- **Language:** TypeScript (primary), Rust (future)
- **Package:** `@glass-framework/cli`
- **Repository:** https://github.com/supercleanse/glass

## Development Workflow

### Branch & PR Process (Mandatory for Every Task)

Every Taskmaster task MUST follow this workflow. No exceptions.

#### 1. Create a Feature Branch

Before starting any task, create a feature branch from `main`:

```bash
git checkout main
git pull origin main
git checkout -b task/<task-id>-<short-description>
```

Branch naming convention: `task/<id>-<kebab-case-description>`
Examples:
- `task/1-init-project-structure`
- `task/4-glass-file-parser`
- `task/7-contract-verifier`

For subtasks, use: `task/<parent-id>.<subtask-id>-<description>`
Examples:
- `task/4.1-result-type-and-parse-errors`
- `task/7.3-invariant-checking`

#### 2. Implement the Task

- Work exclusively on the feature branch
- Commit frequently with clear messages
- All commits must reference the task ID: `[task-<id>] <description>`
- Run tests before considering the task complete

#### 3. Create a Pull Request

Once implementation is complete:

```bash
git push -u origin <branch-name>
gh pr create --title "[Task <id>] <task title>" --body "$(cat <<'EOF'
## Summary
<description of changes>

## Task Reference
Taskmaster Task: <id> — <title>

## Changes
- <bulleted list of changes>

## Test Plan
- <how to verify the changes>

## Checklist
- [ ] Code compiles without errors
- [ ] Tests pass
- [ ] No Glass conventions violated
- [ ] Contracts written (if applicable)
- [ ] Intent documented (if applicable)
EOF
)"
```

#### 4. Code Reviews (Both Required)

Every PR requires **two AI reviews** before merge. Request them in this order:

**a) Claude Review:**
```bash
gh pr review <pr-number> --request-review claude
```
Claude reviews for:
- Correctness and contract satisfaction
- Glass methodology compliance
- Intent/contract completeness
- Security considerations
- Code quality and TypeScript best practices

**b) Gemini Review:**
```bash
gh pr review <pr-number> --request-review gemini
```
Gemini reviews for:
- Correctness and edge cases
- Performance considerations
- API design and usability
- Test coverage adequacy
- Documentation quality

#### 5. Address Review Feedback

- Fix ALL issues raised by both reviewers
- Push fixes to the same feature branch
- Re-request reviews if substantial changes were made
- Do NOT merge until both reviewers approve (no outstanding issues)

#### 6. Merge

Once both reviews pass with no outstanding issues:

```bash
gh pr merge <pr-number> --squash --delete-branch
```

- Always squash merge to keep main history clean
- Delete the feature branch after merge
- Update the Taskmaster task status to `done`

### Workflow Summary

```
main ──┬─────────────────────────────────── main (updated)
       │                                      ↑
       └── task/4-glass-file-parser ──────── merge (squash)
              │       │       │       │
              v       v       v       v
           commit  commit  PR created  fixes
                            │    │
                         Claude  Gemini
                         review  review
```

### Rules

1. **Never commit directly to main.** All changes go through feature branches and PRs.
2. **Never merge without both reviews passing.** Both Claude and Gemini must approve.
3. **Never skip the PR process** — even for "small" changes.
4. **One task per branch.** Do not combine multiple tasks in a single PR.
5. **Keep PRs focused.** If a task is too large, work on its subtasks as separate PRs.

## Glass Methodology

> **Post-Ignition:** The Glass compiler now enforces these rules automatically via `glass verify` and `glass compile`. This section remains as documentation and guidance. See [IGNITION.md](IGNITION.md) for details on the self-hosting milestone.

Follow these rules for all Glass source files:

### Always

- Generate `.glass` files with both sections: Intent and Contract (spec-only)
- Ensure every `.glass` file in `glass/` has a paired implementation file (`.ts` or `.rs`) in `src/` with the same basename
- Maintain the `manifest.glass` — track every requirement origin
- Write contracts for every unit — requires, guarantees, invariants, fails
- Link every intent to its source (PRD, conversation, or AI-generated)
- Handle every failure mode explicitly in the contract
- Use the `Result<T, E>` pattern for error handling
- Use plan mode before implementing to capture intent

### Never

- Create an implementation file in `src/` (`.ts`/`.rs`) without a paired `.glass` spec file in `glass/`
- Create a `.glass` spec without both Intent and Contract sections
- Leave failure modes unhandled
- Expose sensitive data in outputs or logs
- Modify source .glass files during compilation
- Skip the verification step

### .glass File Format

`.glass` files are **spec-only** -- they contain Intent and Contract sections but no implementation code. Implementation lives in a paired target-language file (`.ts` or `.rs`) with the same basename in the mirrored `src/` directory. For example, `glass/compiler/parser.glass` is paired with `src/compiler/parser.ts`.

```
=== Glass Unit ===
id: <module>.<unit_name>
version: 0.1.0
language: typescript

=== Intent ===
purpose: <plain English description of why this exists>
source: <prd | conversation/<id> | ai-generated>
parent: <parent intent id | null>
stakeholder: <user | product | engineering | security>
subIntents:
  - <child.intent.id>
  - <child.intent.id> (ai-generated, <reason>)
approvalStatus: <approved | pending | auto-approved>

=== Contract ===
requires:
  - <precondition>
  - <precondition>

guarantees:
  on_success:
    - <postcondition>
  on_failure:
    - <postcondition>

invariants:
  - <property that must always hold>

fails:
  <ErrorType>: <handling strategy>

advisories:
  - <decision flagged for human review>
```

> **Note:** The parser supports both the current spec-only format and the legacy 4-section format (with `=== Implementation ===`) for backward compatibility.

### Intent Hierarchy

Every intent forms a tree:
- Root intents have `parent: null`
- Every non-root intent references its parent
- Sub-intents decompose a parent into smaller units
- Three sources: `prd`, `conversation`, `ai-generated`

### Contract Rules

Every contract must have:
- **requires** — preconditions (refuse to run if not met)
- **guarantees** — postconditions split into on_success and on_failure
- **invariants** — properties that hold throughout execution
- **fails** — every failure mode with explicit handling
- **advisories** — (optional) decisions flagged for human review

### Verification Levels

| Level | Meaning |
|-------|---------|
| PROVEN | Formally verified by the compiler |
| INSTRUMENTED | Runtime checks injected |
| TESTED | Verified through generated tests |
| UNVERIFIABLE | Requires human review |

## Coding Standards

### TypeScript

- Strict mode always enabled
- Use `Result<T, E>` instead of throwing exceptions (internal code)
- Prefer `const` over `let`, never use `var`
- Use explicit return types on public functions
- Use descriptive names — no abbreviations
- Keep functions focused — single responsibility
- Document public APIs with JSDoc

### Naming

- Files: `kebab-case.glass` (spec, in `glass/`) paired with `kebab-case.ts` (implementation, in `src/`)
- Classes: `PascalCase`
- Functions/methods: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Types/Interfaces: `PascalCase`
- Glass unit IDs: `module.unit_name` (dotted, snake_case)

### Project Structure

Specs (`.glass` files) live in the top-level `glass/` directory. Implementation (`.ts` files) lives in `src/`. The two directories mirror each other in structure. Humans work in `glass/` (specs); AI generates code in `src/` (implementation). The `glass.config.json` file configures both via `glassDir` and `sourceDir` fields.

```
glass-project/
├── CLAUDE.md                    # This file (project guide)
├── IGNITION.md                  # Self-hosting milestone record
├── manifest.glass               # Living requirements document
├── glass.config.json            # Project configuration (glassDir, sourceDir)
├── glass/                       # Specs — human-facing (.glass files)
│   ├── compiler/                # Mirrors src/compiler/
│   │   ├── parser.glass
│   │   ├── verifier.glass
│   │   └── ...
│   ├── cli/                     # Mirrors src/cli/
│   │   └── commands/
│   ├── adapters/
│   └── types/
├── src/                         # Implementation — compiled artifacts (.ts files)
│   ├── compiler/                # Parser, linker, verifier, emitter
│   ├── cli/                     # CLI commands
│   ├── adapters/                # Language adapters
│   └── types/                   # TypeScript type definitions
├── glass-views/                 # Auto-generated views (never hand-edit)
├── dist/                        # Compiled output
├── annotations/                 # Human annotations on outlines
├── tests/                       # Test suite
└── packages/
    ├── mcp-server/              # MCP server package
    └── claude-skill/            # Claude Skill package
```

### Git

- Commit messages: `[task-<id>] <imperative description>`
- One logical change per commit
- Never commit: `node_modules/`, `dist/`, `.env`, credentials
- Optionally commit: `glass-views/`

## Integration with Taskmaster

Each Taskmaster task maps to a Glass unit:
- Task description → Intent (purpose)
- Task acceptance criteria → Contract (guarantees)
- Task dependencies → Intent hierarchy (parent/child)
- Task completion → Verification (all contracts satisfied)

## Bootstrap Phases

| Phase | Authority | Status |
|-------|-----------|--------|
| Phase 0: Bootstrap | CLAUDE.md (this file) | Complete |
| Phase 1.5: Ignition | Glass compiler + CLAUDE.md | **Complete** (2026-02-01) |
| Phase 2+: Self-hosting | Glass compiler (CLAUDE.md becomes guide) | **Current** |

## Self-Verification

After any change to `.glass` files, run:

```bash
glass verify --glass-dir glass/ --source src/     # All units must be PROVEN
glass compile --glass-dir glass/ --source src/     # Must emit files successfully
```

The Glass compiler enforces all contract rules automatically. See [IGNITION.md](IGNITION.md) for the full milestone record.
