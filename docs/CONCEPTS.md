# Glass Concepts

## Philosophy

Glass inverts traditional software development:

| Traditional | Glass |
|---|---|
| Humans write code | AI writes code |
| Humans review code | Humans review structured outlines |
| Tests verify after the fact | Contracts verified before emission |
| Documentation is separate | Documentation is generated from source |
| Audit trail is manual | Traceability is automatic |

## The Three Layers

Every Glass unit has three layers:

### 1. Intent Layer — WHY

The Intent declares why this code exists. It traces to a business goal, conversation, or AI-generated requirement.

- **Purpose**: Plain-English statement of what this unit does and why
- **Source**: Where this intent came from (PRD, conversation, AI)
- **Parent**: Position in the intent hierarchy
- **Stakeholder**: Who cares about this intent

### 2. Contract Layer — WHAT

The Contract declares what this code guarantees. It specifies preconditions, postconditions, invariants, and failure handling.

- **Requires**: What must be true before execution
- **Guarantees**: What will be true after execution (success and failure paths)
- **Invariants**: What must always be true throughout execution
- **Fails**: Every possible failure with a defined response
- **Advisories**: Decisions flagged for human review

### 3. Implementation Layer — HOW

Standard TypeScript (or Rust) code that implements the contract. This is the only layer the compiler emits.

## Intent Hierarchy

Intents form a tree from business goals to implementation details:

```
Business Goal (PRD)
├── Feature Intent (Conversation)
│   ├── Sub-feature (Conversation)
│   ├── Security measure (AI-generated, auto-approved)
│   └── Audit logging (AI-generated, auto-approved)
└── Feature Intent (Conversation)
    └── ...
```

## Verification Levels

The Glass verifier assigns each contract assertion a verification level:

| Level | Meaning |
|---|---|
| **PROVEN** | Statically verified from the code structure |
| **INSTRUMENTED** | Runtime check injected to verify at execution time |
| **TESTED** | Verified by test suite (future) |
| **UNVERIFIABLE** | Cannot be automatically verified — flagged for review |

## Compilation Pipeline

```
Parse .glass files → Link intent tree → Verify contracts → Generate views → Emit code
```

1. **Parse**: Extract the three layers from .glass files
2. **Link**: Build the intent hierarchy, validate references
3. **Verify**: Check implementation satisfies contract
4. **Views**: Generate human-readable outlines and dashboards
5. **Emit**: Output clean standard TypeScript (only if verified)

## The Eject Guarantee

Glass code is standard TypeScript. You can run `glass eject` at any time to get a standalone project with no Glass dependencies. The code is yours.
