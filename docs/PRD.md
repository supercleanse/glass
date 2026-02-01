# GLASS

## Framework Specification

**AI-Authored. Human-Auditable. Formally Verified.**

Version 0.1.0 | February 2026

*A framework for AI-first software development where AI writes all code, humans review structured outlines, and a compiler guarantees the implementation satisfies its contracts.*

---

## Table of Contents

1. Executive Summary
2. Core Philosophy
3. Architecture Overview
4. The .glass File Format
5. The Three Layers
6. The Manifest
7. The Intent System
8. The Contract System
9. The Verification System
10. Views and Dashboards
11. The Glass Compiler Pipeline
12. CLI Commands
13. Language Adapters
14. Distribution Strategy
15. The Bootstrap: Building Glass
16. Project Structure
17. Example: Complete Login System
18. Roadmap

---

## 1. Executive Summary

Glass is a framework for AI-first software development. It sits on top of existing programming languages (TypeScript first, then Rust) and enforces a development model where:

- **AI writes all code.** Humans never directly edit implementation files. They describe intent through conversation, and the AI generates everything.
- **Humans review structured outlines.** Every piece of code has an associated intent (why it exists) and contract (what it guarantees), presented as scannable, structured documents.
- **A compiler enforces correctness.** The Glass compiler rejects any implementation that doesn't satisfy its contracts. Nothing deploys without passing verification.
- **Standard deployment.** The output is normal TypeScript or Rust. Deploy to Cloudflare, AWS, GCP, Heroku, or anywhere else with zero friction.

> **What Glass Is Not**
>
> Glass is not a new programming language. It is a framework with a mandatory pre-compiler step that sits on top of existing languages.
>
> Glass is not an IDE or editor. It is a toolchain that integrates with any AI coding tool.
>
> Glass is not a testing framework. It uses formal verification to prove correctness, not just test for it.

---

## 2. Core Philosophy

### 2.1 Design Principles

| Principle | Description |
|---|---|
| **AI-Authored** | AI writes all implementation code, contracts, and documentation. Humans direct through conversation and annotation. |
| **Human-Auditable** | Every piece of code links to human-readable intent outlines and contract outlines. Humans can understand what the system does without reading code. |
| **Formally Verified** | The Glass compiler proves that implementations satisfy their contracts. Verification is not optional. |
| **Intent-Preserving** | Every line of code traces back to a stated purpose. Nothing exists without a reason. |
| **Transparent** | Like glass itself: rigid, complex, yet completely see-through. You look through the code to the intent. |

### 2.2 The Glass Metaphor

The name Glass captures far more than transparency, though that's where it begins. You see through glass. You look through the code to understand the intent.

**Glass is strong.** Tempered glass is nearly indestructible. Laminated glass holds together even when shattered. Gorilla Glass survives impacts that would destroy other materials. Glass programs are strong because contracts make them formally verified — not just tested, but proven.

**Glass has structure.** At the molecular level, glass is amorphous, but engineered glass is precisely structured for its purpose. Fiber-optic glass channels light across continents. Borosilicate glass withstands thermal shock. The structure is invisible to the casual observer, but it's what makes the material perform. Glass programs have invisible structure too: intents, contracts, and verification layers that the end user never sees but that guarantee correctness.

**Glass takes many forms.** A simple window pane. A cathedral's stained glass. A hand-blown art piece. A fiber-optic cable carrying data at the speed of light. The same fundamental material, shaped for radically different purposes. A simple CRUD API is window glass — utilitarian, clear, does its job. A complex distributed system is stained glass — intricate, multi-layered, purposeful in every detail. The framework accommodates both.

**Glass shatters visibly.** When glass breaks, you know immediately. There is no hidden failure. Glass programs fail the same way: the compiler rejects violations loudly, verification failures are explicit, and nothing deploys in a broken state.

**Glass is engineered, not natural.** Glass doesn't occur by accident. It is manufactured with precision, under extreme conditions, to exact specifications. Glass programs are the same: deliberately designed through intent, constrained by contracts, proven by verification.

### 2.3 The Human Role

In Glass, humans do not write code. They do not edit files. Their role is:

- **Describe intent:** Tell the AI what you want the system to do.
- **Review outlines:** Read the generated intent and contract outlines.
- **Approve or redirect:** Confirm the AI's approach or request changes.
- **Annotate:** Attach notes to specific lines in generated outlines for the AI to address.
- **Review advisories:** Examine decisions the AI flagged for human judgment.

> **Why No Human Editing?**
>
> Glass is AI-first. The AI writes everything. The Glass compiler guarantees consistency between intents, contracts, and implementation. If humans edited files directly, that guarantee breaks.
>
> When AI gets stuck in current tools, it's because it loses context, can't see connections, has no formal definition of correct, and gets slow feedback. Glass solves all four problems: the manifest provides context, contracts define connections, verification defines correctness, and the compiler gives instant feedback.
>
> The escape valve is annotation: humans attach notes to outlines, and the AI acts on them.

---

## 3. Architecture Overview

### 3.1 The Pipeline

Glass operates as a pre-compiler that sits between human intent and deployable code:

```
Human intent (conversation / annotation)
    ↓
AI generates .glass files (intents + contracts + implementation)
    ↓
Glass Compiler (THE ENFORCEMENT LAYER)
    │  • Parses contracts from .glass files
    │  • Verifies implementation satisfies contracts
    │  • Checks all intents are linked
    │  • Checks all failure modes are handled
    │  • Rejects anything that doesn't pass
    ↓
TypeScript / Rust output (clean, standard code)
    ↓
Normal language compiler (tsc / rustc)
    ↓
Deployable artifact
```

### 3.2 Framework with Compiler Guarantees

Glass is a framework, not a language. But it achieves compiler-level enforcement through a mandatory pre-compiler step. This is the same pattern as TypeScript: JavaScript is the real language, TypeScript adds a type layer, and the TypeScript compiler rejects code that violates its rules before JavaScript ever runs.

Glass does this one level up. The Glass compiler validates that implementations satisfy their contracts, then emits clean target-language code. If verification fails, it refuses to emit code.

### 3.3 Two Passes, Two Layers

| Pass | Responsibility |
|---|---|
| **Pass 1: Glass Compiler** | Validates intents, contracts, and verification. Emits target-language code only if all checks pass. |
| **Pass 2: Language Compiler** | Standard tsc or rustc compilation. Type safety, optimization, platform targeting. |

Nothing deploys unless both passes succeed.

---

## 4. The .glass File Format

Each unit of functionality lives in a single .glass file. This file contains all three layers: intent, contract, and implementation. The Glass toolchain extracts human-readable views automatically.

### 4.1 File Structure

```
=== Glass Unit ===
id: auth.authenticate_user
version: 0.1.0
language: typescript

=== Intent ===
purpose: Allow registered users to securely log into the system
source: conversation/session-1
parent: null
stakeholder: user

sub-intents:
  - auth.validate_credentials
  - auth.manage_session
  - auth.sanitize_input (ai-generated, security)
  - auth.rate_limit_login (ai-generated, security)
  - auth.log_auth_attempt (ai-generated, audit)

=== Contract ===
requires:
  - input.email is String
  - input.password is String
  - system.database is Active
  - system.session_store is Active

guarantees:
  on_success:
    - result is AuthSuccess
    - result.session is ValidSession
    - result.session.userId == verified_user.id
    - audit_log appended with AuthAttempt(success: true)
  on_failure:
    - result is AuthFailure
    - result.reason in [InvalidCredentials, AccountLocked,
                         RateLimited, ServiceUnavailable]
    - no session created
    - audit_log appended with AuthAttempt(success: false)

invariants:
  - user.password_hash never exposed in output or logs
  - user.password_hash never held in memory after comparison
  - rate_limit.state correctly updated

fails:
  DatabaseUnavailable: retry(3) then Error(ServiceUnavailable)
  SessionStoreUnavailable: retry(3) then Error(ServiceUnavailable)
  RateLimitExceeded: Error(RateLimited, lockout: remaining_seconds)
  UnexpectedError: Error(ServiceUnavailable), alert(ops-team)

advisories:
  - rate_limit_login uses fail-open policy (see unit for details)

=== Implementation ===
// AI-generated TypeScript implementation
// ... (actual code here)
```

### 4.2 Key Principles

- **Single source of truth:** The .glass file is the only real file. All human-readable documents are generated from it.
- **AI-authored:** The AI generates every section. Humans review the generated outlines, not the .glass file.
- **Versioned:** Every .glass file has a version. Changes are tracked in the manifest.
- **Linked:** Every .glass file has an id that links it to its parent intent, its sub-intents, and its siblings.

---

## 5. The Three Layers

Glass enforces a strict separation between three layers, each with a distinct purpose and format:

| Layer | Question | Format | Audience |
|---|---|---|---|
| **Intent** | WHY does this exist? | Structured outline | Product managers, stakeholders |
| **Contract** | WHAT does it guarantee? | Structured outline | Auditors, security, architects |
| **Verification** | DID it pass? | Checklist | Engineers, CI/CD pipelines |

The implementation layer (the actual code) sits beneath all three. It is AI-generated, rarely human-read, and formally verified against the contracts.

---

## 6. The Manifest

Every Glass project has a manifest.glass file at its root. This is the living requirements document that the AI maintains automatically. It tracks where every requirement came from and how it connects to the system.

### 6.1 Manifest Structure

```
Glass Manifest: AuthSystem
Version: 0.1.0
Language: TypeScript
Created: 2026-02-01

Origins:
  PRD: "Initial product requirements document"
    → uploaded by user, 2026-02-01

  Conversation: "Chat session #47"
    → user said: "we also need to handle refunds"
    → AI derived: RefundOrder intent
    → user approved: yes

  AI-Generated: "Utility intents"
    → AI determined: InputValidation needed
    → reason: "security best practice"
    → user approved: pending

Policies:
  auto-approve: security, audit
  require-approval: business-logic, data-model

Intent Registry:
  user-originated: 12 intents
  conversation-derived: 8 intents
  ai-generated: 15 intents (12 approved, 3 pending)
```

### 6.2 Three Sources of Requirements

- **User-originated:** From the initial PRD or explicit user requests.
- **Conversation-derived:** Requirements that emerged through iterative conversation with the AI. The manifest records exactly which conversation and what the user said.
- **AI-generated:** Requirements the AI identified as necessary (security, audit, best practices). These follow the project's approval policies.

### 6.3 Approval Policies

| Policy | Description |
|---|---|
| **auto-approve** | Requirements in these categories are automatically approved. Typically: security, audit, infrastructure. |
| **require-approval** | Requirements in these categories must be explicitly approved by the human. Typically: business logic, data model changes, user-facing behavior. |
| **pending** | AI-generated requirements awaiting human review. The AI can build against pending requirements, but the compiler will flag them. |

---

## 7. The Intent System

Every unit of code in Glass must have an intent: a structured declaration of why it exists. Intents form a hierarchical tree that maps from high-level business goals down to individual functions.

### 7.1 Intent Outline Format

Intents are presented as structured outlines, not code. A human with zero programming knowledge can read them:

```
This system allows users to securely log in.

To accomplish this, the system must:

  1. Validate the user's credentials against stored data
     - Which first requires sanitizing all user input

  2. Create a secure session for the authenticated user

  3. Limit login attempts to prevent brute force attacks
     (identified by AI as a security necessity)

  4. Log every authentication attempt for audit purposes
     (identified by AI as an audit necessity)
```

### 7.2 Intent Properties

| Property | Description |
|---|---|
| **Purpose** | A plain-English statement of what this unit does and why. |
| **Source** | Where this intent came from: PRD, conversation, or AI-generated. |
| **Parent** | The parent intent in the hierarchy (null for top-level). |
| **Sub-intents** | Child intents that decompose this intent. |
| **Stakeholder** | Who cares about this intent (user, product, engineering, security). |
| **Approval Status** | Approved, pending, or auto-approved (with policy reference). |

### 7.3 Intent Traceability

Every intent links back to its origin. This creates a complete audit trail from business goal to implementation:

```
Business Goal: "Users can manage their accounts"
  → Source: PRD section 3.1
  → Sub-intent: "Users can view order history"
    → Source: Conversation #12, user request
    → Contract: RetrieveOrders
    → Implementation: retrieve_orders.glass
      → Sub-intent: "Sanitize order query input"
        → Source: AI-generated (security)
        → Auto-approved under security policy
```

---

## 8. The Contract System

Contracts are the soul of Glass. Every unit of code must declare what it requires, what it guarantees, what it will never do, and how it handles failure. Contracts are presented as structured outlines.

### 8.1 Contract Outline Format

Contracts are structured, scannable, and human-readable without programming knowledge:

```
ValidateCredentials

Purpose: Check email/password against stored data.
Source: Derived from AuthenticateUser

Requires:
  - Email sanitized, valid format
  - Password sanitized, 8–128 characters
  - Database connected

Guarantees on success:
  ✓ Verified user identity returned
  ✓ Constant-time comparison used

Guarantees on failure:
  ✓ Returns InvalidCredentials
  ✓ Same error whether user missing or password wrong
    (prevents enumeration)

Will never:
  ✗ Send raw queries to database (parameterized only)
  ✗ Write plaintext password to any storage
  ✗ Leak password length through timing

Failure handling:
  Database timeout → propagate as DatabaseUnavailable
  Corrupted hash → alert security team, ServiceUnavailable
```

### 8.2 Contract Sections

| Section | Description |
|---|---|
| **Purpose** | Plain-English summary with source traceability. |
| **Requires** | Preconditions that must be true before execution. The code refuses to run otherwise. |
| **Guarantees** | Postconditions that will be true after execution. Split into on_success and on_failure. |
| **Will Never (Invariants)** | Properties that remain true throughout execution. The code must not violate these. |
| **Failure Handling** | Every possible failure mode, explicitly named with a defined response. No unhandled exceptions. |
| **Advisories** | Decisions the AI flagged for human review. Security tradeoffs, policy choices, ambiguities. |

### 8.3 Contracts Are Mandatory

The Glass compiler rejects any .glass file that lacks a contract. This is non-negotiable. If the AI cannot specify what a unit of code guarantees, the code should not exist.

### 8.4 The Annotation System

Humans direct changes through annotations on generated outlines:

```
Guarantees on success:
  ✓ Session linked to verified user
  ✓ Session expires after configured duration
    📝 Human note: "duration should be 24 hours for regular
       users, 1 hour for admin users. AI — please implement
       this distinction."
  ✓ Previous sessions invalidated
```

The AI reads annotations, modifies the .glass file, the toolchain regenerates all outlines, and the annotation remains visible until the human removes it.

---

## 9. The Verification System

Verification is presented as a checklist. Pass or fail. Every contract assertion maps to a verifiable check.

### 9.1 Verification Checklist Format

```
Verification: AuthenticateUser

  ☑ Email provided (string)
  ☑ Password provided (string)
  ☑ Database available
  ☑ Session store available
  ☑ Valid session returned on success
  ☑ Session linked to correct user
  ☑ Session has expiration
  ☑ Audit log appended on success
  ☑ Audit log appended on failure
  ☑ No session created on failure
  ☑ Password hash never exposed in output
  ☑ Password hash never exposed in logs
  ☑ Password not held in memory after comparison
  ☑ All failure modes handled
  ☑ All failure modes map to declared reasons
  ⚠ 1 advisory pending human review
    (rate limiter fail-open policy)

Status: PROVEN — 15 assertions verified, 1 advisory
```

### 9.2 Verification Methods

The Glass compiler uses a combination of methods to verify contracts:

- **Static analysis:** Type-level guarantees, data flow analysis, unreachable code detection.
- **Formal proof:** Where possible, mathematical proof that the implementation satisfies the contract.
- **Runtime instrumentation:** Where formal proof isn't possible, the compiler injects runtime checks that enforce invariants during execution.
- **Generated tests:** Automatic test generation from contracts as a supplementary verification layer.

### 9.3 Verification Levels

| Level | Description |
|---|---|
| **PROVEN** | Formally verified. The compiler has mathematically proven the assertion. |
| **INSTRUMENTED** | Cannot be formally proven. Runtime checks have been injected. |
| **TESTED** | Verified through generated tests. Lower confidence than proven or instrumented. |
| **UNVERIFIABLE** | The assertion cannot be verified. Requires human review. The compiler warns but does not reject. |

---

## 10. Views and Dashboards

Glass generates multiple views of the same system, each tailored to a different audience.

### 10.1 Business View

For product managers and stakeholders. Plain English, no technical detail:

```
AuthSystem allows registered users to log in. It verifies their
email and password, creates a session, and logs them in. It
protects against brute force attacks with rate limiting. All
attempts are logged for audit.
```

### 10.2 Security View

For security auditors. Focused on security posture:

```
SECURITY POSTURE: AuthSystem v0.1.0

✓ Input sanitization on all external strings
✓ Constant-time password comparison
✓ No plaintext password in memory after comparison
✓ No password hashes exposed in responses or logs
✓ Parameterized queries only (SQL injection protected)
✓ Rate limiting: 5 attempts per 15 minutes
⚠ Rate limiter fails open (availability policy)
✓ Cryptographic session tokens (256-bit)
✓ Previous sessions invalidated on new login
✓ User enumeration prevented (uniform error responses)
✓ All PII hashed in audit logs
```

### 10.3 Verification Dashboard

For engineers and CI/CD. Roll-up status of all units:

```
VERIFICATION STATUS: AuthSystem v0.1.0

AuthenticateUser:     PROVEN ✓
ValidateCredentials:  PROVEN ✓
SanitizeInput:        PROVEN ✓
ManageSession:        PROVEN ✓
RateLimitLogin:       PROVEN ✓
  ⚠ advisory: fail-open policy flagged for review
LogAuthAttempt:       PROVEN ✓

All contracts satisfied. 0 unproven assertions.
1 advisory requiring human review.
```

### 10.4 Generated Documentation

All views are generated as markdown files in the .generated/ directory. They are always current because they are derived from the .glass source files.

---

## 11. The Glass Compiler Pipeline

### 11.1 Compilation Steps

1. **Parse** — Read all .glass files. Extract intent, contract, and implementation sections.
2. **Link** — Resolve all parent/child intent relationships. Build the intent tree. Verify all references are valid.
3. **Verify Completeness** — Every implementation has an intent and contract. Every failure mode is handled. Every intent traces to a source.
4. **Verify Contracts** — Formally prove (where possible) that implementations satisfy their contracts. Inject runtime checks where proof is not possible.
5. **Generate Views** — Extract human-readable outlines, checklists, dashboards. Write to .generated/ directory.
6. **Emit Code** — Output clean target-language code to dist/ directory. Only if all verification passes.

### 11.2 What the Compiler Enforces

- Every implementation unit has an intent and contract.
- Every contract requirement maps to a verifiable assertion.
- Every failure mode declared in the contract is handled in the implementation.
- No implementation exists without a parent intent.
- Contract guarantees are formally checked against the code.
- Invariants are instrumented as runtime checks where formal proof is not possible.
- All intent sources are valid (PRD, conversation, or AI-generated with policy).

### 11.3 CI/CD Integration

```
# Standard CI pipeline with Glass
1. glass verify     ← contracts check (fails build if violated)
2. glass compile    ← emit TypeScript to dist/
3. tsc              ← normal TypeScript compilation
4. npm test         ← normal tests still work
5. deploy           ← standard deployment to any platform
```

---

## 12. CLI Commands

| Command | Description |
|---|---|
| `glass init` | Initialize a new Glass project. Creates manifest.glass, directory structure, and configuration. |
| `glass generate` | AI generates .glass files from the current manifest and conversation context. |
| `glass verify` | Run the verification pipeline. Check all contracts against implementations. Output verification checklists. |
| `glass compile` | Full compilation: verify + emit target-language code to dist/. |
| `glass views` | Generate all human-readable outlines, checklists, and dashboards to .generated/. |
| `glass annotate <unit> <line> <note>` | Attach a human annotation to a specific line in a generated outline. |
| `glass status` | Show current verification status of all units. Summary dashboard. |
| `glass tree` | Display the full intent tree. |
| `glass trace <unit>` | Show the full provenance chain for a unit: from business goal to implementation. |
| `glass diff` | Show what changed since the last compilation. Intent changes, contract changes, new units. |
| `glass eject` | Export clean target-language code with no Glass dependencies. Walk away cleanly. |

---

## 13. Language Adapters

Glass is language-agnostic at the human layer. The implementation language is configured once at project setup and handled by a language-specific adapter.

### 13.1 What Adapters Do

- Translate contracts into language-native constructs (TypeScript interfaces, Rust traits).
- Hook into the language's type system for verification.
- Generate idiomatic code for the target language.
- Map verification results back to contract terms.

### 13.2 Supported Languages

| Language | Status |
|---|---|
| **TypeScript (v1.0)** | First supported language. Largest ecosystem, best AI code generation, expressive type system. Types map naturally to contract assertions. |
| **Rust (v2.0)** | Second target. Strongest type system, ownership model prevents memory bugs, excellent formal verification tooling. |
| **Future** | Go, Kotlin, C# are candidates. Community-contributed adapters possible. |

### 13.3 Standard Output

After compilation, the dist/ directory contains completely standard target-language code. The deployment target never knows Glass exists:

- Cloudflare Workers → `wrangler deploy`
- AWS Lambda → SAM / CDK deploy
- GCP Cloud Functions → `gcloud functions deploy`
- Heroku → `git push heroku main`
- Vercel / Netlify → connect repo, auto-deploy
- Docker → standard Dockerfile

> **Eject at Any Time**
>
> If you want to stop using Glass, run `glass eject`. The generated TypeScript or Rust is clean, idiomatic, standalone code. You keep the dist/ output and walk away. No vendor lock-in.

---

## 14. Distribution Strategy

Glass is distributed through three layers, allowing users to adopt it at whatever level fits their workflow.

### 14.1 Layer 1: npm CLI Package (Core)

The foundation. A standard npm package that provides the full Glass toolchain:

```bash
# Install globally
npm install -g @glass-framework/cli

# Or use with npx (no install needed)
npx @glass-framework/cli init

# Initialize a project
glass init my-project --language typescript

# Full compilation
glass compile
```

This works with any AI tool. The user talks to their AI, the AI generates .glass files, and the CLI handles compilation and verification.

### 14.2 Layer 2: MCP Server

A Model Context Protocol server that wraps the Glass CLI and exposes Glass commands as tools that any MCP-compatible AI can call directly:

```json
{
  "mcpServers": {
    "glass": {
      "command": "glass-mcp-server",
      "args": ["--project", "./my-project"]
    }
  }
}
```

This makes Glass available to any AI tool that supports MCP: Claude (via Claude Code, Claude Desktop), Cursor, GitHub Copilot, Gemini, Windsurf, and others. The AI can directly call `glass init`, `glass verify`, `glass compile` as tools.

**MCP Tools Exposed:**

| Tool | Description |
|---|---|
| `glass_init` | Initialize a Glass project |
| `glass_generate` | Generate .glass files from conversation context |
| `glass_verify` | Run verification and return checklist results |
| `glass_compile` | Full compilation pipeline |
| `glass_views` | Generate human-readable outlines and dashboards |
| `glass_status` | Return current verification status |
| `glass_annotate` | Add human annotation to a generated outline |
| `glass_tree` | Return the intent tree |
| `glass_trace` | Return provenance chain for a unit |

### 14.3 Layer 3: Claude Skill

The fastest path to adoption for Claude users. A skill file that gives Claude deep knowledge of Glass and integrates it into the conversational workflow:

```
Location: .claude/skills/glass/SKILL.md

The skill provides:
  - Full Glass methodology knowledge
  - .glass file format specification
  - Contract writing best practices
  - Automatic manifest maintenance
  - Integration with the MCP server or CLI
```

The Claude Skill makes Claude aware of Glass conventions so it naturally generates .glass files, maintains the manifest, and follows the intent/contract/verification pattern without the user needing to explain the methodology each time.

### 14.4 Adoption Path

| Path | Steps |
|---|---|
| **Quickest (Claude users)** | Install the Claude Skill. Start talking to Claude about your project. Claude generates Glass files automatically. |
| **Any AI tool** | Install the MCP server. Connect it to your AI tool of choice. The AI calls Glass commands directly. |
| **Manual / CI** | Install the npm CLI. Use `glass init`, `glass compile` in your terminal or CI pipeline. Works with any workflow. |

### 14.5 Open Source Strategy

Glass will be released as open source (MIT license). The core components:

- **@glass-framework/cli** — The compiler and CLI toolchain
- **@glass-framework/mcp-server** — MCP server wrapping the CLI
- **@glass-framework/typescript-adapter** — TypeScript language adapter
- **@glass-framework/rust-adapter** — Rust language adapter (v2)
- **@glass-framework/claude-skill** — Claude Skill for instant adoption

Community contributions welcome for additional language adapters, IDE integrations, and view generators.

---

## 15. The Bootstrap: Building Glass

### 15.1 The Chicken-and-Egg Problem

Glass is a framework for AI-first development. Glass itself must be developed. But Glass doesn't exist yet — so how do you build it using its own methodology?

This is a classic bootstrap problem, and Glass solves it in three phases.

### 15.2 Implementation Language

Glass is written in TypeScript. This is the natural choice: TypeScript is Glass's first target language, the AI generates it exceptionally well, the npm ecosystem is where the distribution layer lives (CLI, MCP server), and the TypeScript type system provides the foundation for contract verification. The compiler, CLI, MCP server, and TypeScript adapter are all TypeScript. The Rust adapter will eventually require some Rust, but the core toolchain is TypeScript throughout.

### 15.3 Phase 1: The CLAUDE.md Proto-Compiler

Before Glass can compile anything, a comprehensive CLAUDE.md file serves as the proto-compiler. This file teaches Claude Code the entire Glass methodology: how to structure .glass files, how to maintain the manifest, how to write contracts, and how to organize intent hierarchies.

The CLAUDE.md enforces Glass patterns by convention. Claude Code reads it at the start of every session and behaves as if the Glass compiler exists — generating .glass files, maintaining the manifest, writing contracts for every unit — even though no actual compiler is checking its work yet.

```
glass-framework/
├── CLAUDE.md                    # THE PROTO-COMPILER
│   │
│   │  Contains:
│   │  - Full Glass methodology
│   │  - .glass file format spec
│   │  - Contract writing rules
│   │  - Manifest maintenance rules
│   │  - Intent hierarchy rules
│   │  - "Always generate .glass files"
│   │  - "Always maintain the manifest"
│   │  - "Never create implementation without a contract"
│   │
├── manifest.glass               # Maintained by Claude per CLAUDE.md
├── src/
│   ├── compiler/
│   │   ├── parser.glass         # Glass file parser
│   │   ├── linker.glass         # Intent tree linker
│   │   ├── verifier.glass       # Contract verifier
│   │   └── emitter.glass        # Code emitter
│   ├── cli/
│   │   ├── init.glass
│   │   ├── verify.glass
│   │   ├── compile.glass
│   │   └── ...
│   └── adapters/
│       └── typescript.glass
└── .generated/                  # Views generated by Claude per CLAUDE.md
```

During this phase, the CLAUDE.md is the authority. It can't prove correctness, but it ensures the project follows Glass conventions from day one. Every .glass file has an intent. Every unit has a contract. The manifest tracks origins. The structure is right even if the enforcement is manual.

### 15.4 Phase 2: Self-Hosting (The Ignition)

Once the Glass compiler can parse .glass files, verify contracts, and emit TypeScript, it reaches a critical milestone: it can compile itself.

At this point, Glass begins verifying its own source files. The CLAUDE.md remains in place but is no longer the sole authority — the real compiler is now checking the real contracts. Violations that the CLAUDE.md missed become visible.

This transition — from CLAUDE.md-enforced to Glass-enforced — is **The Ignition**. It's the moment Glass proves its own thesis: that AI-authored, contract-verified code works not just in theory but in practice, on the very toolchain that enables it.

```
Before Ignition:
  CLAUDE.md says "this contract is satisfied" → trust Claude

After Ignition:
  glass verify says "this contract is PROVEN" → trust the compiler
```

### 15.5 Phase 3: Full Self-Hosting

After Ignition, all development on Glass itself uses Glass. New features are specified as intents, constrained by contracts, verified by the compiler, and emitted as TypeScript. The CLAUDE.md evolves from proto-compiler to project guide — it still teaches Claude Code the conventions, but the compiler does the enforcement.

The CLAUDE.md never goes away entirely. It remains the project's knowledge base: coding standards, architectural decisions, contribution guidelines. But it's no longer pretending to be a compiler. The real compiler has arrived.

> **Why This Bootstrap Matters**
>
> Self-hosting is not just a technical milestone. It's proof of concept. If Glass can build Glass — if the framework can enforce its own contracts, verify its own correctness, and maintain its own intent tree — then it works. The bootstrap is the ultimate test.

### 15.6 Leveraging Plan Mode and Taskmaster MCP

Glass doesn't exist in isolation. Two existing tools — Claude Code's plan mode and the Taskmaster MCP — are natural allies during the bootstrap and become more powerful once Glass exists.

#### Plan Mode as the Intent Bridge

Claude Code's plan mode is a lightweight version of what Glass's intent layer does: before writing code, Claude steps back and outlines its approach. The difference is that plan mode is ephemeral — the plan lives in conversation context and disappears when the session ends. Glass makes that plan permanent, structured, and verifiable.

During the bootstrap, the CLAUDE.md instructs Claude to use plan mode as the conversation-to-intent bridge:

```
Workflow during Bootstrap:

1. Human describes what they want
2. Claude enters plan mode → thinks through the approach
3. CLAUDE.md says: "Before implementing, encode this plan
   as a Glass intent in the manifest and create the .glass
   file with contract"
4. Claude writes the intent, contract, then implementation
5. The plan doesn't evaporate — it becomes a permanent,
   structured intent with a formal contract
```

After Glass is self-hosting, plan mode continues to serve this role. Claude plans, then the plan is captured as intents and contracts that the compiler can verify. Plan mode becomes the thinking step; Glass becomes the formalization step.

#### Taskmaster MCP as the Build Orchestrator

Taskmaster decomposes complex work into tasks with dependencies, tracks progress, and manages sequencing. This maps almost directly onto Glass's intent tree — each Taskmaster task is essentially a sub-intent with dependency relationships.

During the bootstrap, Taskmaster manages the build sequence:

```
Taskmaster Task Graph (Bootstrap):

Task 1: Glass File Format Parser
  depends: none
  glass-unit: compiler.parser

Task 2: Intent Tree Linker
  depends: Task 1 (parser)
  glass-unit: compiler.linker

Task 3: Contract Verifier
  depends: Task 1 (parser), Task 2 (linker)
  glass-unit: compiler.verifier

Task 4: Code Emitter
  depends: Task 3 (verifier)
  glass-unit: compiler.emitter

Task 5: CLI Framework
  depends: Task 4 (emitter)
  glass-unit: cli.framework

Task 6: The Ignition (self-hosting)
  depends: Tasks 1–5
  milestone: Glass compiles itself
```

Each Taskmaster task maps 1:1 to a Glass unit. The task description becomes the intent. The acceptance criteria become the contract. Taskmaster tracks progress; Glass verifies correctness.

#### The Symbiotic Relationship

Glass improves both tools, and both tools help build Glass:

| Tool | How it helps build Glass | How Glass improves it |
|---|---|---|
| **Plan Mode** | Provides the thinking step before intent formalization. Claude reasons through approach before committing to structure. | Plans become permanent intents with contracts instead of evaporating. The plan's promises become formally verified guarantees. |
| **Taskmaster** | Manages build sequencing, dependencies, and progress tracking during bootstrap. Breaks the project into manageable units. | Task completion gains formal verification — a task isn't "done" when code compiles, it's done when contracts are proven. Task dependencies map to intent hierarchies that persist across sessions. |
| **Glass Manifest** | N/A (doesn't exist yet during early bootstrap) | Provides persistent context that both plan mode and Taskmaster lack. The manifest survives across sessions, so neither tool starts from zero. |

The long-term vision: a developer describes what they want. Plan mode reasons through the approach. Taskmaster breaks it into sequenced tasks. Glass formalizes each task as an intent with a contract. The AI implements each unit. The Glass compiler proves the contracts. The human reviews structured outlines. Nothing deploys without verification.

Plan mode is the mind. Taskmaster is the scheduler. Glass is the guarantee.

---

## 16. Project Structure

```
project-root/
├── manifest.glass              # Living requirements document
├── glass.config.json            # Project configuration
├── src/
│   ├── auth/
│   │   ├── authenticate_user.glass
│   │   ├── validate_credentials.glass
│   │   ├── manage_session.glass
│   │   ├── sanitize_input.glass
│   │   ├── rate_limit_login.glass
│   │   └── log_auth_attempt.glass
│   └── orders/
│       ├── retrieve_orders.glass
│       └── ...
├── .generated/                  # Auto-generated, never hand-edit
│   ├── master-intent-outline.md
│   ├── master-contract-outline.md
│   ├── master-verification-status.md
│   ├── views/
│   │   ├── business-view.md
│   │   ├── security-view.md
│   │   └── verification-dashboard.md
│   └── per-unit/
│       ├── authenticate_user.intent.md
│       ├── authenticate_user.contract.md
│       ├── authenticate_user.verification.md
│       └── ...
├── dist/                        # Compiled output (standard code)
│   ├── authenticate_user.ts
│   ├── validate_credentials.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── ...
└── .annotations/                # Human annotations on outlines
    └── authenticate_user.annotations.json
```

> **What Gets Committed to Git**
>
> **Commit:** manifest.glass, glass.config.json, src/*.glass, .annotations/
>
> **Optionally commit:** .generated/ (useful for review, but can be regenerated)
>
> **Never commit:** dist/ (always regenerated by the compiler)

---

## 17. Example: Complete Login System

This section shows what the full Glass workflow looks like for the authentication system designed throughout this specification.

### 17.1 The Conversation

```
User: "Build me a user login system."

AI: Generates manifest.glass with:
  - 1 user-originated intent (login system)
  - 2 conversation-derived intents (validate, session)
  - 3 AI-generated intents (sanitize, rate limit, audit log)
  - All AI intents auto-approved under security/audit policy

AI: Generates 6 .glass files in src/auth/
AI: Runs glass compile
AI: All 6 units PROVEN
AI: 1 advisory (rate limiter fail-open policy)

AI presents to human:
  - Intent tree (structured outline)
  - Contract outlines for each unit
  - Verification checklist
  - Security view
  - Advisory requiring human decision
```

### 17.2 The Human Review

```
Human reviews intent tree: ✓ Looks correct
Human reviews contracts: ✓ Guarantees are sufficient
Human reviews advisory:
  ⚠ Rate limiter fails open (availability over security)
  Human annotates: "Change to fail-closed. Security > availability."

AI reads annotation, updates rate_limit_login.glass
AI re-runs glass compile
All 6 units PROVEN, 0 advisories outstanding
Human approves
```

### 17.3 Deployment

```
# dist/ contains clean TypeScript:
dist/
  authenticate_user.ts
  validate_credentials.ts
  manage_session.ts
  sanitize_input.ts
  rate_limit_login.ts
  log_auth_attempt.ts
  package.json
  tsconfig.json

# Deploy to any platform:
cd dist && npm install && wrangler deploy
```

---

## 18. Roadmap

### Phase 0: Bootstrap (pre-v0.1)

- Comprehensive CLAUDE.md proto-compiler
- Project structure following Glass conventions from day one
- All source files as .glass files (convention-enforced, not compiler-enforced)
- Manifest maintained manually by Claude Code per CLAUDE.md rules
- Written in TypeScript

### Phase 1: Foundation (v0.1)

- Glass file format parser
- Basic contract verification (type-level, static analysis)
- TypeScript adapter
- CLI: init, verify, compile, views, status, tree
- Generated markdown views
- Claude Skill for rapid adoption

### Phase 1.5: The Ignition

- Glass compiles itself for the first time
- Self-hosting: all Glass development verified by Glass
- CLAUDE.md transitions from proto-compiler to project guide
- The framework proves its own thesis

### Phase 2: MCP + Verification (v0.2)

- MCP server with full tool exposure
- Enhanced formal verification (SMT solver integration)
- Runtime instrumentation for unproven assertions
- Annotation system
- Manifest auto-maintenance from conversation

### Phase 3: Rust + Ecosystem (v0.3)

- Rust language adapter
- Community adapter API for additional languages
- IDE extensions (VS Code, JetBrains)
- GitHub / GitLab integration (PR reviews with contract diffs)

### Phase 4: Production (v1.0)

- Battle-tested compiler with comprehensive verification
- Full TypeScript and Rust support
- MCP server stable API
- Glass Skill available for major AI coding tools
- Documentation, tutorials, and example projects

---

*Glass: See through the code to the intent.*
