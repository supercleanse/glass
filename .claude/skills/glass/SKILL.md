# Glass Framework Skill

## Overview

Glass is an AI-first development framework where AI writes all code, humans review structured outlines, and a compiler guarantees correctness. You are working in a Glass project.

## Your Role

When working on a Glass project:

1. **Always generate .glass files** — never raw .ts or .rs files
2. **Maintain the manifest.glass** — track all requirement origins
3. **Write contracts for everything** — every unit needs Intent + Contract + Implementation
4. **Follow the three-layer pattern** for each unit

## The .glass File Format

Every unit of functionality lives in a single `.glass` file with four sections:

```
=== Glass Unit ===
id: <dotted.identifier>
version: 0.1.0
language: typescript

=== Intent ===
purpose: <plain English — WHY this code exists>
source:
  kind: <prd | conversation | ai-generated>
  reference: <where it came from>
parent: <parent.id or null>
stakeholder: <user | product | engineering | security>
subIntents:
  - <child.id>
  - <child.id> (annotation1, annotation2)
approvalStatus: <approved | pending | auto-approved>

=== Contract ===
requires:
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

=== Implementation ===
<TypeScript or Rust code>
```

## Contract Writing Rules

**Requires**: What must be true before execution. Include input validation and system dependencies.

**Guarantees on success**: What will be true after successful execution. Be specific about return types and side effects.

**Guarantees on failure**: What will be true after failed execution. Must include error type and what does NOT happen.

**Invariants**: Properties that must hold throughout execution. Security properties go here (e.g., "password never logged").

**Fails**: Every possible failure mode with an explicit handling strategy. Format: `ErrorType: strategy`. Common strategies: `retry(n) then Error(Type)`, `Error(Type)`, `Error(Type), alert(team)`.

**Advisories**: Flag any security tradeoffs, ambiguous requirements, or policy decisions for human review.

## Intent Hierarchy

Intents form a tree:
- Root intents come from the PRD or user requests
- Child intents are derived from conversations or AI generation
- AI-generated intents (security, audit, infrastructure) can be auto-approved per policy
- Business logic and data model intents require explicit approval

## Manifest Maintenance

The `manifest.glass` file tracks:
- **Origins**: Where every requirement came from (PRD, conversation, AI)
- **Policies**: Which categories auto-approve vs require human approval
- **Intent Registry**: Counts of user-originated, conversation-derived, and AI-generated intents

Update the manifest whenever you add, remove, or modify intents.

## Workflow

1. Receive a requirement from the user
2. Create or update manifest.glass with the origin
3. Design the intent hierarchy (what units are needed and how they relate)
4. Generate .glass files for each unit
5. Run `glass verify` to check contracts against implementation
6. Run `glass compile` to emit clean TypeScript
7. Present views to the human for review (intent tree, contract outlines, verification checklist)
8. Address any annotations or advisories
9. Re-verify and re-compile after changes

## Available Commands

- `glass init <name>` — Initialize a new project
- `glass verify` — Run contract verification
- `glass compile` — Full compilation pipeline
- `glass views` — Generate human-readable outlines
- `glass status` — Verification dashboard
- `glass tree` — Display intent hierarchy
- `glass trace <unitId>` — Show provenance chain
- `glass annotate <unitId> <target> <note>` — Add human annotation
- `glass eject` — Export standalone code

## MCP Tools (if available)

When the Glass MCP server is configured, use these tools:
- `glass_init` — Initialize a project
- `glass_verify` — Run verification
- `glass_compile` — Compile the project
- `glass_views` — Generate views
- `glass_status` — Check status
- `glass_tree` — View intent tree
- `glass_trace` — Trace provenance
- `glass_annotate` — Add annotation
- `glass_annotations_list` — List annotations

## Key Principles

- **Single source of truth**: The .glass file is the only real file. Everything else is generated.
- **AI writes, humans review**: Generate outlines for human review, not raw code.
- **No unhandled failures**: Every error path must be declared in the contract.
- **Traceability**: Every intent traces back to a business goal.
- **Eject anytime**: Users can leave Glass and keep clean standard code.
