# Glass Framework — Intents and Contracts Reference

> Task 25.2: Write Intents and Contracts for All Compiler and CLI Components
> Created: 2026-02-01
>
> This document contains the exact Intent and Contract sections (in .glass format)
> for every Glass framework source file. These will be embedded into .glass files
> during conversion (Task 25.3).

---

## Phase A — Foundation

### types.core

```
=== Intent ===
purpose: Define all Glass framework type definitions including Result<T,E>, GlassFile, Contract, Intent, and compiler types
source:
  kind: prd
  reference: "PRD Sections 4, 8, 9"
parent: glass.framework
stakeholder: engineering

sub-intents: []
approvalStatus: approved

=== Contract ===
requires:
  - "TypeScript strict mode is enabled"
guarantees:
  on_success:
    - "All types compile without errors under strict mode"
    - "Result<T,E> provides Ok and Err constructors with type narrowing"
    - "mapResult, flatMapResult, and collectResults are pure functions"
    - "All PRD domain concepts have corresponding type definitions"
    - "GlassFile type represents all three .glass sections"
    - "Contract type includes requires, guarantees, invariants, fails, and advisories"
  on_failure: []
invariants:
  - "Types are purely declarative with no runtime side effects"
  - "Result discriminated union uses 'ok' boolean for type narrowing"
fails: []
advisories: []
```

### compiler.orchestrator

```
=== Intent ===
purpose: Orchestrate the full Glass compilation pipeline (parse, link, verify, emit)
source:
  kind: prd
  reference: "PRD Section 11.1"
parent: glass.compiler
stakeholder: engineering

sub-intents: []
approvalStatus: approved

=== Contract ===
requires:
  - "sourcePaths is an array of valid file paths"
  - "CompilerOptions provides rootDir and outDir"
guarantees:
  on_success:
    - "Returns CompilationResult with success: true"
    - "Pipeline stages execute in order: parse, link, verify, emit"
    - "Diagnostics array contains info messages for each stage"
    - "Duration reflects actual elapsed time in milliseconds"
  on_failure:
    - "Returns CompilationResult with success: false"
    - "Diagnostics include error messages identifying the failing stage"
invariants:
  - "Source files are never modified"
  - "Pipeline stages are idempotent"
fails: []
advisories:
  - "GlassCompiler.compile() is currently a stub; real pipeline runs through CLI commands via loadProject()"
```

---

## Phase B — Compiler Core

### compiler.parser

*(Existing contract from src/glass/compiler/compiler.parser.glass — updated parent)*

```
=== Intent ===
purpose: Parse .glass files into structured GlassFile objects, extracting the three layers (Intent, Contract, Implementation)
source:
  kind: prd
  reference: "PRD Section 4 and 11.1 step 1"
parent: glass.compiler
stakeholder: engineering

sub-intents: []
approvalStatus: approved

=== Contract ===
requires:
  - "filePath is a valid string path"
  - "file exists on disk for parseGlassFile"
  - "content follows .glass format with four sections"
guarantees:
  on_success:
    - "Returns GlassFile with all three sections extracted"
    - "id, version, and language are populated from Glass Unit header"
    - "Intent has purpose, source, parent, stakeholder, subIntents"
    - "Contract has requires, guarantees, invariants, fails, advisories"
  on_failure:
    - "Returns ParseError with reason, message, and filePath"
    - "ParseError includes section where failure occurred"
invariants:
  - "Original file is never modified"
  - "Parser is stateless"
fails:
  FileNotFound: "Error(ParseError, reason: FileNotFound)"
  InvalidFormat: "Error(ParseError, reason: InvalidFormat)"
  MissingSection: "Error(ParseError, reason: MissingSection)"
  InvalidSectionContent: "Error(ParseError, reason: InvalidSectionContent)"
advisories: []
```

### compiler.linker

*(Existing contract from src/glass/compiler/compiler.linker.glass — updated parent)*

```
=== Intent ===
purpose: Build and validate the intent tree from parsed .glass files, resolving parent-child relationships
source:
  kind: prd
  reference: "PRD Section 11.1 step 2"
parent: glass.compiler
stakeholder: engineering

sub-intents: []
approvalStatus: approved

=== Contract ===
requires:
  - "files is an array of valid GlassFile objects"
  - "each file has a unique id"
guarantees:
  on_success:
    - "Returns IntentTree with all relationships resolved"
    - "No circular dependencies exist"
    - "All parent references point to existing files"
    - "All sub-intent references point to existing files"
  on_failure:
    - "Returns LinkError with reason and unitId"
invariants:
  - "Input files are never modified"
  - "Linker is deterministic"
fails:
  DanglingReference: "Error(LinkError, reason: DanglingReference)"
  CircularDependency: "Error(LinkError, reason: CircularDependency)"
  DuplicateId: "Error(LinkError, reason: DuplicateId)"
advisories: []
```

### compiler.verifier

*(Existing contract from src/glass/compiler/compiler.verifier.glass — updated parent)*

```
=== Intent ===
purpose: Verify that implementations satisfy their contracts through static analysis and pattern matching
source:
  kind: prd
  reference: "PRD Section 9"
parent: glass.compiler
stakeholder: engineering

sub-intents: []
approvalStatus: approved

=== Contract ===
requires:
  - "file is a valid GlassFile with contract and implementation"
guarantees:
  on_success:
    - "Returns VerificationResult with all assertions checked"
    - "Each assertion has a verification level (PROVEN, INSTRUMENTED, TESTED, UNVERIFIABLE)"
    - "Overall status is PROVEN if all assertions pass"
  on_failure:
    - "Returns VerificationResult with status FAILED"
    - "Failed assertions include explanation messages"
invariants:
  - "Implementation code is never modified"
  - "Verification is deterministic — same input produces same output"
fails: []
advisories: []
```

### compiler.emitter

*(Existing contract from src/glass/compiler/compiler.emitter.glass — updated parent)*

```
=== Intent ===
purpose: Output clean standard TypeScript from verified .glass files with dependency resolution and atomic writes
source:
  kind: prd
  reference: "PRD Section 11.1 step 6"
parent: glass.compiler
stakeholder: engineering

sub-intents: []
approvalStatus: approved

=== Contract ===
requires:
  - "files are verified GlassFile objects (all contracts satisfied)"
  - "verificationResults contains PROVEN status for each file"
  - "outputDir is a valid writable path"
guarantees:
  on_success:
    - "Emitted TypeScript compiles with tsc"
    - "No Glass artifacts in output code"
    - "Each file has auto-generated header comment"
    - "tsconfig.json generated for the output"
  on_failure:
    - "Returns EmitterError with reason and details"
    - "No partial files written on failure"
invariants:
  - "Source .glass files are never modified"
  - "Emission is deterministic"
fails:
  VerificationNotPassed: "Error(EmitterError, reason: VerificationNotPassed)"
  WriteError: "Error(EmitterError, reason: WriteError)"
advisories: []
```

### compiler.manifest

```
=== Intent ===
purpose: Parse, manage, and serialize manifest.glass living requirements documents
source:
  kind: prd
  reference: "PRD Section 5"
parent: glass.compiler
stakeholder: engineering

sub-intents: []
approvalStatus: approved

=== Contract ===
requires:
  - "filePath is a valid string path for parseManifest"
  - "content is a valid string for parseManifestContent"
  - "manifest.glass follows the manifest format with header, origins, policies, and intent registry"
guarantees:
  on_success:
    - "Returns Manifest with projectName, version, language, created, origins, policies, intentRegistry"
    - "serializeManifest round-trips correctly with parseManifestContent"
    - "ManifestManager.load returns a functional manager instance"
    - "ManifestManager.save persists manifest to disk"
  on_failure:
    - "Returns ManifestError with reason and message"
    - "ManifestError includes filePath when available"
invariants:
  - "Parsing is deterministic"
  - "ManifestManager operations do not modify the file until save() is called"
fails:
  FileNotFound: "Error(ManifestError, reason: FileNotFound)"
  InvalidFormat: "Error(ManifestError, reason: InvalidFormat)"
  MissingField: "Error(ManifestError, reason: MissingField)"
  InvalidVersion: "Error(ManifestError, reason: InvalidVersion)"
advisories: []
```

### compiler.annotations

```
=== Intent ===
purpose: Manage human annotations on Glass units for AI-human collaboration
source:
  kind: prd
  reference: "PRD Section 7"
parent: glass.compiler
stakeholder: user

sub-intents: []
approvalStatus: approved

=== Contract ===
requires:
  - "annotationsDir is a valid directory path"
  - "unitId is a non-empty string"
  - "target follows valid format: line:<n> or dotted path (intent.*, contract.*, implementation.*)"
guarantees:
  on_success:
    - "addAnnotation persists annotation to .annotations/<unitId>.annotations.json"
    - "Each annotation has a unique generated ID"
    - "resolveAnnotation sets resolved: true and persists"
    - "deleteAnnotation removes the annotation from storage"
    - "loadAnnotations returns all annotations for a unit"
    - "getUnresolvedAnnotations returns only annotations where resolved is false"
  on_failure:
    - "Returns AnnotationError with reason and message"
invariants:
  - "Annotation files are scoped per unit (one JSON file per unitId)"
  - "Annotation IDs are unique across the project"
  - "Empty annotation files are deleted (not left as empty arrays)"
fails:
  UnitNotFound: "Error(AnnotationError, reason: UnitNotFound)"
  AnnotationNotFound: "Error(AnnotationError, reason: AnnotationNotFound)"
  InvalidTarget: "Error(AnnotationError, reason: InvalidTarget)"
  WriteError: "Error(AnnotationError, reason: WriteError)"
advisories: []
```

### compiler.view_generator

```
=== Intent ===
purpose: Generate human-readable views, checklists, and dashboards from Glass units for stakeholder review
source:
  kind: prd
  reference: "PRD Section 10"
parent: glass.compiler
stakeholder: user

sub-intents: []
approvalStatus: approved

=== Contract ===
requires:
  - "files is a non-empty array of valid GlassFile objects"
  - "tree is a valid IntentTree with all references resolved"
  - "results contains a VerificationResult for each file"
  - "outputDir is a valid writable path"
guarantees:
  on_success:
    - "Generates per-unit views: intent outline, contract outline, verification checklist"
    - "Generates aggregate views: business view, security view, verification dashboard"
    - "Generates master documents: master intent outline, master contract outline"
    - "All views are valid markdown with auto-generated header"
    - "Returns array of all generated file paths"
  on_failure:
    - "Returns ViewGeneratorError with reason and message"
invariants:
  - "Source .glass files are never modified"
  - "View generation is deterministic"
  - "Generated views reflect current state of inputs"
fails:
  WriteError: "Error(ViewGeneratorError, reason: WriteError)"
  InvalidInput: "Error(ViewGeneratorError, reason: InvalidInput)"
advisories: []
```

---

## Phase C — CLI Infrastructure

### cli.utils

```
=== Intent ===
purpose: Provide shared utilities for CLI commands including .glass file discovery and project loading
source:
  kind: ai-generated
  reason: "Common functionality extracted from CLI commands"
parent: glass.cli
stakeholder: engineering

sub-intents: []
approvalStatus: approved

=== Contract ===
requires:
  - "dir is a valid directory path"
guarantees:
  on_success:
    - "discoverGlassFiles returns all .glass files recursively under dir"
    - "discoverGlassFiles excludes node_modules, .generated, and manifest.glass"
    - "loadProject returns ProjectContext with parsed files, linked tree, and verification results"
  on_failure:
    - "discoverGlassFiles returns empty array if directory does not exist"
    - "loadProject returns Err with descriptive error message"
invariants:
  - "Discovery never modifies files"
  - "loadProject runs the full pipeline: parse, link, verify"
fails: []
advisories: []
```

### cli.entry

```
=== Intent ===
purpose: Register and dispatch all Glass CLI commands via Commander.js
source:
  kind: prd
  reference: "PRD Section 12"
parent: glass.cli
stakeholder: engineering

sub-intents: []
approvalStatus: approved

=== Contract ===
requires:
  - "process.argv is available"
guarantees:
  on_success:
    - "All 11 commands are registered: init, verify, compile, views, status, tree, trace, eject, annotate, build, audit"
    - "Version and help flags are available"
    - "Command dispatch routes to correct handler"
  on_failure:
    - "Unknown commands display help text"
invariants:
  - "Command registration is deterministic"
fails: []
advisories: []
```

---

## Phase D — CLI Commands

### cli.cmd_init

```
=== Intent ===
purpose: Initialize a new Glass project with directory structure, manifest, and configuration
source:
  kind: prd
  reference: "PRD Section 12 — glass init"
parent: glass.cli
stakeholder: user

sub-intents: []
approvalStatus: approved

=== Contract ===
requires:
  - "name argument is a non-empty string"
guarantees:
  on_success:
    - "Creates project directory with src/, dist/, .generated/, .annotations/, tests/"
    - "Creates manifest.glass with project name and default settings"
    - "Creates glass.config.json with project configuration"
    - "Creates .gitignore with standard Glass ignore patterns"
    - "Exit code is 0"
  on_failure:
    - "Displays error message if directory exists and is non-empty"
    - "Exit code is 1"
invariants:
  - "Never overwrites existing non-empty directories"
fails:
  DirectoryExists: "Error message and exit code 1"
advisories: []
```

### cli.cmd_verify

```
=== Intent ===
purpose: Run contract verification on all Glass files and display results
source:
  kind: prd
  reference: "PRD Section 12 — glass verify"
parent: glass.cli
stakeholder: user

sub-intents: []
approvalStatus: approved

=== Contract ===
requires:
  - "Current directory or --source flag points to a valid Glass project"
guarantees:
  on_success:
    - "Displays per-unit verification status with pass/fail counts"
    - "Verbose mode shows individual assertion details"
    - "Exit code is 0 when all units pass"
  on_failure:
    - "Displays error details for failing units"
    - "Exit code is 1 when any unit fails verification"
invariants:
  - "Verification is read-only — no files modified"
fails:
  ProjectNotFound: "Error message and exit code 1"
  VerificationFailed: "Error details and exit code 1"
advisories: []
```

### cli.cmd_compile

```
=== Intent ===
purpose: Run the full compilation pipeline: verify, generate views, emit TypeScript
source:
  kind: prd
  reference: "PRD Section 12 — glass compile"
parent: glass.cli
stakeholder: user

sub-intents: []
approvalStatus: approved

=== Contract ===
requires:
  - "Current directory or --source flag points to a valid Glass project"
  - "Output directory is writable"
guarantees:
  on_success:
    - "All contracts verified before emission"
    - "Views generated in .generated/ directory"
    - "TypeScript emitted to output directory"
    - "Compilation duration reported"
    - "Exit code is 0"
  on_failure:
    - "Compilation halted at failing stage"
    - "Error message identifies the failing stage and unit"
    - "Exit code is 1"
invariants:
  - "Source .glass files are never modified"
  - "Unverified code is never emitted"
fails:
  ProjectNotFound: "Error message and exit code 1"
  VerificationFailed: "Error details and exit code 1"
  EmitFailed: "Error details and exit code 1"
advisories: []
```

### cli.cmd_views

```
=== Intent ===
purpose: Generate human-readable views from Glass files
source:
  kind: prd
  reference: "PRD Section 12 — glass views"
parent: glass.cli
stakeholder: user

sub-intents: []
approvalStatus: approved

=== Contract ===
requires:
  - "Current directory or --source flag points to a valid Glass project"
guarantees:
  on_success:
    - "Views generated in .generated/ directory"
    - "Reports count of generated views"
    - "Exit code is 0"
  on_failure:
    - "Error message with details"
    - "Exit code is 1"
invariants:
  - "Source .glass files are never modified"
fails:
  ProjectNotFound: "Error message and exit code 1"
  ViewGenerationFailed: "Error message and exit code 1"
advisories: []
```

### cli.cmd_status

```
=== Intent ===
purpose: Display verification status dashboard for the Glass project
source:
  kind: prd
  reference: "PRD Section 12 — glass status"
parent: glass.cli
stakeholder: user

sub-intents: []
approvalStatus: approved

=== Contract ===
requires:
  - "Current directory or --source flag points to a valid Glass project"
guarantees:
  on_success:
    - "Displays summary: total units, verified, failed, pending approvals"
    - "Displays per-unit status with pass/fail assertion counts"
    - "Exit code is 0"
  on_failure:
    - "Error message with details"
    - "Exit code is 1"
invariants:
  - "Status display is read-only"
fails:
  ProjectNotFound: "Error message and exit code 1"
advisories: []
```

### cli.cmd_tree

```
=== Intent ===
purpose: Display the intent hierarchy tree with approval status and sources
source:
  kind: prd
  reference: "PRD Section 12 — glass tree"
parent: glass.cli
stakeholder: user

sub-intents: []
approvalStatus: approved

=== Contract ===
requires:
  - "Current directory or --source flag points to a valid Glass project"
guarantees:
  on_success:
    - "Renders ASCII tree showing parent-child relationships"
    - "Each node shows unit ID, purpose, source tag, and approval status"
    - "Depth option limits tree rendering depth"
    - "Exit code is 0"
  on_failure:
    - "Error message with details"
    - "Exit code is 1"
invariants:
  - "Tree display is read-only"
fails:
  ProjectNotFound: "Error message and exit code 1"
advisories: []
```

### cli.cmd_trace

```
=== Intent ===
purpose: Show the provenance chain from root to a specific Glass unit
source:
  kind: prd
  reference: "PRD Section 12 — glass trace"
parent: glass.cli
stakeholder: user

sub-intents: []
approvalStatus: approved

=== Contract ===
requires:
  - "Current directory or --source flag points to a valid Glass project"
  - "unitId argument identifies an existing Glass unit"
guarantees:
  on_success:
    - "Displays ancestry chain from root to target unit"
    - "Shows purpose, source, and approval for each ancestor"
    - "Lists direct children of the target unit"
    - "Exit code is 0"
  on_failure:
    - "Reports if unit not found"
    - "Exit code is 1"
invariants:
  - "Trace display is read-only"
fails:
  ProjectNotFound: "Error message and exit code 1"
  UnitNotFound: "Error message and exit code 1"
advisories: []
```

### cli.cmd_eject

```
=== Intent ===
purpose: Eject a Glass project to standalone TypeScript code independent of Glass
source:
  kind: prd
  reference: "PRD Section 12 — glass eject"
parent: glass.cli
stakeholder: user

sub-intents: []
approvalStatus: approved

=== Contract ===
requires:
  - "dist/ directory exists and contains compiled output"
  - "Output directory is writable"
guarantees:
  on_success:
    - "Copies all compiled TypeScript from dist/ to output directory"
    - "Copies tsconfig.json and package.json"
    - "Creates EJECTED.md documenting the ejection"
    - "Ejected project is a standalone TypeScript project"
    - "Exit code is 0"
  on_failure:
    - "Error message if dist/ is empty or output exists"
    - "Exit code is 1"
invariants:
  - "Source .glass files are never modified"
  - "dist/ directory is never modified (read-only copy)"
fails:
  DistNotFound: "Error message and exit code 1"
  OutputExists: "Error message and exit code 1"
advisories: []
```

### cli.cmd_annotate

```
=== Intent ===
purpose: Add, list, and resolve human annotations on Glass units
source:
  kind: prd
  reference: "PRD Section 12 — glass annotate"
parent: glass.cli
stakeholder: user

sub-intents: []
approvalStatus: approved

=== Contract ===
requires:
  - "Current directory or --source flag points to a valid Glass project"
  - "unitId argument identifies an existing Glass unit"
guarantees:
  on_success:
    - "With target and note: creates annotation and displays ID"
    - "With --list flag: displays all annotations for the unit"
    - "With --resolve flag: marks annotation as resolved"
    - "Exit code is 0"
  on_failure:
    - "Reports if unit or annotation not found"
    - "Exit code is 1"
invariants:
  - "Annotations are persisted to .annotations/ directory"
fails:
  ProjectNotFound: "Error message and exit code 1"
  UnitNotFound: "Error message and exit code 1"
  AnnotationNotFound: "Error message and exit code 1"
  InvalidTarget: "Error message and exit code 1"
advisories: []
```

### cli.cmd_build

```
=== Intent ===
purpose: Legacy compile command using GlassCompiler class
source:
  kind: ai-generated
  reason: "Backward compatibility alias for glass compile"
parent: glass.cli
stakeholder: engineering

sub-intents: []
approvalStatus: approved

=== Contract ===
requires:
  - "Source directory contains .glass files"
guarantees:
  on_success:
    - "Runs GlassCompiler.compile() pipeline"
    - "Displays diagnostic messages with severity colors"
    - "Exit code is 0"
  on_failure:
    - "Displays error diagnostics"
    - "Exit code is 1"
invariants:
  - "Delegates to GlassCompiler class"
fails:
  CompilationFailed: "Error diagnostics and exit code 1"
advisories:
  - "Uses GlassCompiler stub; glass compile command provides the real pipeline"
```

### cli.cmd_audit

```
=== Intent ===
purpose: Display audit trail for Glass project changes
source:
  kind: prd
  reference: "PRD Section 12 — glass audit"
parent: glass.cli
stakeholder: security

sub-intents: []
approvalStatus: approved

=== Contract ===
requires: []
guarantees:
  on_success:
    - "Displays audit trail information"
  on_failure: []
invariants: []
fails: []
advisories:
  - "Placeholder implementation — audit trail functionality not yet implemented"
```

---

## Phase E — Adapters & MCP

### adapters.typescript

```
=== Intent ===
purpose: Provide TypeScript language adapter for Glass compilation
source:
  kind: prd
  reference: "PRD Section 13"
parent: glass.adapters
stakeholder: engineering

sub-intents: []
approvalStatus: approved

=== Contract ===
requires:
  - "GlassFile has language: typescript"
guarantees:
  on_success:
    - "LanguageAdapter interface defines name, fileExtension, and compile method"
    - "typescriptAdapter implements LanguageAdapter for TypeScript targets"
  on_failure: []
invariants:
  - "Adapter is stateless"
fails: []
advisories:
  - "Placeholder implementation — actual TypeScript compilation handled by emitter"
```

### mcp.tools

```
=== Intent ===
purpose: Register Glass operations as MCP tools for AI assistant integration
source:
  kind: prd
  reference: "PRD Section 14"
parent: glass.mcp
stakeholder: engineering

sub-intents: []
approvalStatus: approved

=== Contract ===
requires:
  - "server is a valid McpServer instance"
  - "projectRoot is a valid directory path"
guarantees:
  on_success:
    - "Registers 10 tools: glass_init, glass_verify, glass_compile, glass_views, glass_status, glass_tree, glass_trace, glass_annotate, glass_annotations_list"
    - "Each tool has a Zod schema for input validation"
    - "Each tool returns JSON with success boolean and data/error fields"
  on_failure:
    - "Tool-specific errors returned as JSON with success: false"
invariants:
  - "Tool registration is idempotent"
  - "Tool schemas match their implementations"
fails:
  ToolExecutionFailed: "Returns JSON with success: false and error message"
advisories: []
```

### mcp.server

```
=== Intent ===
purpose: Initialize and start the Glass MCP server with stdio transport
source:
  kind: prd
  reference: "PRD Section 14"
parent: glass.mcp
stakeholder: engineering

sub-intents: []
approvalStatus: approved

=== Contract ===
requires:
  - "process.argv contains --project <dir> argument"
  - "stdio transport is available (stdin/stdout)"
guarantees:
  on_success:
    - "McpServer created with name glass-mcp-server"
    - "All tools registered via registerTools"
    - "Server connected to stdio transport"
  on_failure:
    - "Error written to stderr"
    - "Process exits with code 1"
invariants:
  - "One server per process"
fails:
  InvalidProjectPath: "stderr message and exit code 1"
  TransportError: "stderr message and exit code 1"
advisories: []
```

---

## Phase F — Root Entry

### glass.entry

```
=== Intent ===
purpose: Export the complete Glass public API as a single entry point
source:
  kind: prd
  reference: "PRD Section 12"
parent: glass.framework
stakeholder: engineering

sub-intents: []
approvalStatus: approved

=== Contract ===
requires: []
guarantees:
  on_success:
    - "Exports GlassCompiler class"
    - "Exports parser functions: parseGlassFile, parseGlassContent"
    - "Exports linker functions: linkIntentTree, getAncestors, getChildren"
    - "Exports verifier functions: verifyContract, verifyAll"
    - "Exports emitter function: emitTypeScript"
    - "Exports annotation functions: addAnnotation, loadAnnotations, loadAllAnnotations, resolveAnnotation, deleteAnnotation, getUnresolvedAnnotations"
    - "Exports manifest functions: parseManifest, parseManifestContent, serializeManifest, ManifestManager"
    - "Exports view generator: generateAllViews"
    - "Exports all type definitions from types/index"
    - "Exports Result utilities: Ok, Err, mapResult, flatMapResult, collectResults"
    - "Exports VERSION constant"
  on_failure: []
invariants:
  - "Entry point is a pure re-export module with no logic"
  - "VERSION matches package.json version"
fails: []
advisories: []
```

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total units with intents | 26 |
| Total requires assertions | 38 |
| Total success guarantees | 88 |
| Total failure guarantees | 23 |
| Total invariants | 29 |
| Total named failure modes | 26 |
| Total advisories | 6 |
| Intent sources: prd | 22 |
| Intent sources: ai-generated | 2 |
| Stakeholders: engineering | 16 |
| Stakeholders: user | 9 |
| Stakeholders: security | 1 |
