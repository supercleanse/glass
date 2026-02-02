# Glass API Reference

## CLI Commands

### glass init

Initialize a new Glass project.

```bash
glass init <name> [options]
```

**Arguments:**
- `<name>` — Project name (creates a directory with this name)

**Options:**
- `-l, --language <lang>` — Target language: `typescript` (default) or `rust`
- `--no-git` — Skip git initialization

### glass verify

Run contract verification on all .glass files.

```bash
glass verify [options]
```

**Options:**
- `-s, --source <dir>` — Source directory (default: `src`)
- `--failures-only` — Only show failed verifications
- `-v, --verbose` — Show detailed output

**Exit codes:**
- `0` — All units verified
- `1` — One or more units failed verification

### glass compile

Run the full compilation pipeline.

```bash
glass compile [options]
```

**Options:**
- `-s, --source <dir>` — Source directory (default: `src`)
- `-o, --output <dir>` — Output directory (default: `dist`)
- `--no-verify` — Skip verification (development only)
- `--clean` — Clean output directory before emitting
- `-v, --verbose` — Enable verbose output

### glass views

Generate human-readable outlines and dashboards.

```bash
glass views [options]
```

**Options:**
- `-s, --source <dir>` — Source directory (default: `src`)
- `-o, --output <dir>` — Output directory (default: `glass-views`)

### glass status

Display verification status dashboard.

```bash
glass status [options]
```

**Options:**
- `-s, --source <dir>` — Source directory (default: `src`)

### glass tree

Display the intent hierarchy as an ASCII tree.

```bash
glass tree [options]
```

**Options:**
- `-s, --source <dir>` — Source directory (default: `src`)
- `-d, --depth <n>` — Maximum tree depth

### glass trace

Show the full provenance chain for a unit.

```bash
glass trace <unitId> [options]
```

**Arguments:**
- `<unitId>` — The Glass unit ID to trace

**Options:**
- `-s, --source <dir>` — Source directory (default: `src`)
- `-c, --contracts` — Show contracts at each level

### glass annotate

Add or manage annotations on Glass units.

```bash
glass annotate <unitId> [target] [note] [options]
```

**Arguments:**
- `<unitId>` — Glass unit ID
- `[target]` — Target: `line:<n>` or dotted path (e.g., `contract.guarantees.success.2`)
- `[note]` — Annotation text

**Options:**
- `--author <name>` — Annotation author (default: `human`)
- `--resolve <id>` — Resolve an annotation by ID
- `--list` — List all annotations for the unit
- `--unresolved` — List all unresolved annotations

### glass eject

Export standalone code with no Glass dependencies.

```bash
glass eject [options]
```

**Options:**
- `-o, --output <dir>` — Output directory (default: `ejected`)
- `--dist <dir>` — Compiled dist directory (default: `dist`)
- `--keep-source` — Keep original Glass source files
- `--force` — Skip confirmation prompt

## .glass File Format

`.glass` files are **spec-only** -- they contain the Intent and Contract sections. Implementation lives in a paired target-language file (`.ts` or `.rs`) with the same basename. For example, `parser.glass` is paired with `parser.ts`.

```
=== Glass Unit ===
id: <dotted.identifier>
version: <semver>
language: <typescript | rust>

=== Intent ===
purpose: <plain English purpose>
source:
  kind: <prd | conversation | ai-generated>
  reference: <source reference>
parent: <parent.id | null>
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
  - <property>
fails:
  <ErrorType>: <handling strategy>
advisories:
  - <decision for human review>
```

> **Note:** The parser supports both the current spec-only format and the legacy 4-section format (with `=== Implementation ===`) for backward compatibility.

## glass.config.json

```json
{
  "version": "0.1.0",
  "language": "typescript",
  "projectName": "my-app",
  "outputDir": "dist",
  "generatedDir": "glass-views",
  "annotationsDir": "annotations"
}
```

## Programmatic API

```typescript
import {
  parseGlassFile,
  linkIntentTree,
  verifyContract,
  emitTypeScript,
  generateAllViews,
} from "@glass-framework/cli";

// Parse a .glass file
const result = parseGlassFile("src/auth/login.glass");

// Link intent tree
const tree = linkIntentTree([result.value]);

// Verify contracts
const verification = verifyContract(result.value);

// Emit TypeScript
const emit = emitTypeScript([result.value], verificationMap, "dist");
```
