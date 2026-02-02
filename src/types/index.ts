/**
 * Glass Framework — Core Type Definitions
 *
 * Defines all structures used throughout the Glass compiler pipeline.
 * These types map directly to the .glass file format (PRD Section 4),
 * the intent system (Section 7), the contract system (Section 8),
 * and the verification system (Section 9).
 */

// ============================================================
// Result Type — Used throughout the compiler for error handling
// ============================================================

/** Discriminated union for success/failure without exceptions. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/** Create a success Result. */
export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/** Create a failure Result. */
export function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/** Map over a Result's success value. */
export function mapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (result.ok) {
    return Ok(fn(result.value));
  }
  return result;
}

/** FlatMap over a Result's success value. */
export function flatMapResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  if (result.ok) {
    return fn(result.value);
  }
  return result;
}

/** Collect an array of Results into a Result of array. Fails on first error. */
export function collectResults<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];
  for (const result of results) {
    if (!result.ok) {
      return result;
    }
    values.push(result.value);
  }
  return Ok(values);
}

// ============================================================
// Intent Types — PRD Section 7
// ============================================================

/** Where an intent originated from. */
export type IntentSource =
  | { kind: "prd"; reference: string }
  | { kind: "conversation"; sessionId: string; quote?: string }
  | { kind: "ai-generated"; reason: string };

/** Who cares about this intent. */
export type Stakeholder = "user" | "product" | "engineering" | "security";

/** Approval status of an intent. */
export type ApprovalStatus = "approved" | "pending" | "auto-approved";

/** A sub-intent reference with optional annotations. */
export interface SubIntentRef {
  /** The dotted ID of the referenced sub-intent. */
  id: string;
  /** Annotations like "ai-generated", "security". */
  annotations?: string[];
}

/**
 * The Intent layer — WHY does this code exist?
 * Every unit must have an intent that traces to a source.
 * (PRD Section 7.2)
 */
export interface Intent {
  /** Plain-English statement of what this unit does and why. */
  purpose: string;
  /** Where this intent came from. */
  source: IntentSource;
  /** Parent intent ID in the hierarchy, or null for top-level. */
  parent: string | null;
  /** Who cares about this intent. */
  stakeholder: Stakeholder;
  /** Child intents that decompose this intent. */
  subIntents: SubIntentRef[];
  /** Whether this intent has been approved. */
  approvalStatus: ApprovalStatus;
}

// ============================================================
// Contract Types — PRD Section 8
// ============================================================

/**
 * A single assertion in a contract section.
 * (PRD Section 8.2)
 */
export interface ContractAssertion {
  /** Human-readable description of the assertion. */
  description: string;
  /** After verification, the level at which this was verified. */
  verificationLevel?: VerificationLevel;
}

/**
 * A declared failure mode with its handling strategy.
 * (PRD Section 8.2 — fails section)
 */
export interface FailureMode {
  /** The error type name, e.g. "DatabaseUnavailable". */
  errorType: string;
  /** How this failure is handled, e.g. "retry(3) then Error(ServiceUnavailable)". */
  handling: string;
}

/**
 * A decision flagged for human review.
 * (PRD Section 8.2 — advisories)
 */
export interface Advisory {
  /** Description of the advisory. */
  description: string;
  /** Whether this advisory has been reviewed. */
  resolved: boolean;
}

/**
 * The Contract layer — WHAT does this code guarantee?
 * Every unit must have a contract with requires, guarantees, invariants, and fails.
 * (PRD Section 8.2)
 */
export interface Contract {
  /** Preconditions that must be true before execution. */
  requires: ContractAssertion[];
  /** Postconditions guaranteed after execution. */
  guarantees: {
    onSuccess: ContractAssertion[];
    onFailure: ContractAssertion[];
  };
  /** Properties that must hold throughout execution. */
  invariants: ContractAssertion[];
  /** Every possible failure mode with a defined response. */
  fails: FailureMode[];
  /** Decisions flagged for human review. */
  advisories: Advisory[];
}

// ============================================================
// Glass File Types — PRD Section 4
// ============================================================

/** Supported target languages. */
export type TargetLanguage = "typescript" | "rust";

/**
 * A complete parsed .glass file containing all three layers.
 * This is the single source of truth for a unit of functionality.
 * (PRD Section 4.1)
 */
export interface GlassFile {
  /** Unique dotted identifier, e.g. "auth.authenticate_user". */
  id: string;
  /** Semantic version of this unit. */
  version: string;
  /** Target language for this unit. */
  language: TargetLanguage;
  /** The Intent layer — WHY this code exists. */
  intent: Intent;
  /** The Contract layer — WHAT this code guarantees. */
  contract: Contract;
  /** The raw implementation source code (loaded from paired file or legacy inline). */
  implementation: string;
  /** Absolute path to the .glass spec file. */
  specPath: string;
  /** Absolute path to the implementation file, or null for inline/group units. */
  implementationPath: string | null;
  /** True if implementation is loaded from a separate file (new format). */
  separatedFormat: boolean;
}

// ============================================================
// Manifest Types — PRD Section 6
// ============================================================

/** An origin entry tracking where requirements came from. */
export interface ManifestOrigin {
  /** Type of origin. */
  kind: "prd" | "conversation" | "ai-generated";
  /** Human-readable name. */
  name: string;
  /** Description of what was derived. */
  description: string;
  /** Who or what authored this. */
  author: string;
  /** When this was recorded. */
  date: string;
}

/** Approval policy configuration. */
export interface ApprovalPolicies {
  /** Categories that are automatically approved. */
  autoApprove: string[];
  /** Categories that require explicit human approval. */
  requireApproval: string[];
}

/** Intent registry statistics. */
export interface IntentRegistryCounts {
  userOriginated: number;
  conversationDerived: number;
  aiGenerated: number;
}

/**
 * The manifest.glass file — the living requirements document.
 * (PRD Section 6.1)
 */
export interface Manifest {
  /** Project name. */
  projectName: string;
  /** Project version. */
  version: string;
  /** Primary language. */
  language: TargetLanguage;
  /** When the project was created. */
  created: string;
  /** Tracked origins of all requirements. */
  origins: ManifestOrigin[];
  /** Approval policies by category. */
  policies: ApprovalPolicies;
  /** Intent count statistics. */
  intentRegistry: IntentRegistryCounts;
}

// ============================================================
// Verification Types — PRD Section 9
// ============================================================

/**
 * How an assertion was verified.
 * (PRD Section 9.3)
 */
export type VerificationLevel = "PROVEN" | "INSTRUMENTED" | "TESTED" | "UNVERIFIABLE";

/**
 * A single verification assertion result.
 */
export interface VerificationAssertion {
  /** The original contract assertion text. */
  assertion: string;
  /** Whether this assertion passed. */
  passed: boolean;
  /** How this was verified. */
  level: VerificationLevel;
  /** Explanation of the verification result. */
  message: string;
}

/**
 * The result of verifying a single Glass unit.
 * (PRD Section 9.1)
 */
export interface VerificationResult {
  /** The Glass unit ID that was verified. */
  unitId: string;
  /** Overall status: PROVEN if all assertions passed. */
  status: "PROVEN" | "FAILED";
  /** Individual assertion results. */
  assertions: VerificationAssertion[];
  /** Advisories from the contract. */
  advisories: Advisory[];
}

// ============================================================
// Compiler Types
// ============================================================

/** Severity levels for diagnostic messages. */
export type Severity = "error" | "warning" | "info";

/** A diagnostic message produced during any compilation phase. */
export interface DiagnosticMessage {
  severity: Severity;
  code: string;
  message: string;
  file?: string;
  line?: number;
  column?: number;
}

/** Options controlling Glass compiler behavior. */
export interface CompilerOptions {
  /** Source directory containing .glass files. */
  rootDir: string;
  /** Output directory for emitted code. */
  outDir: string;
  /** Enable strict verification mode. */
  strict: boolean;
  /** Generate source maps. */
  sourceMap: boolean;
  /** Generate TypeScript declaration files. */
  declaration: boolean;
  /** Enable verbose output. */
  verbose: boolean;
}

/** The result of a full compilation run. */
export interface CompilationResult {
  success: boolean;
  diagnostics: DiagnosticMessage[];
  outputFiles: string[];
  duration: number;
}

// ============================================================
// Parse Error Types
// ============================================================

/** Reasons a .glass file parse can fail. */
export type ParseErrorReason =
  | "FileNotFound"
  | "InvalidFormat"
  | "MissingSection"
  | "InvalidSectionContent"
  | "ImplementationFileNotFound";

/** Error returned when parsing a .glass file fails. */
export interface ParseError {
  reason: ParseErrorReason;
  message: string;
  filePath: string;
  line?: number;
  column?: number;
  section?: "Glass Unit" | "Intent" | "Contract" | "Implementation";
}

// ============================================================
// Linker Types
// ============================================================

/** Error returned when linking the intent tree fails. */
export interface LinkError {
  reason: "DanglingReference" | "CircularDependency" | "DuplicateId";
  message: string;
  unitId: string;
  referencedId?: string;
}

/** The linked intent tree mapping all parent/child relationships. */
export interface IntentTree {
  /** All Glass files indexed by ID. */
  files: Map<string, GlassFile>;
  /** IDs of root-level intents (parent: null). */
  roots: string[];
  /** Map from child ID to parent ID (or null). */
  parentMap: Map<string, string | null>;
  /** Map from parent ID to array of child IDs. */
  childrenMap: Map<string, string[]>;
}

// ============================================================
// Emitter Types
// ============================================================

/** Reasons code emission can fail. */
export type EmitterErrorReason =
  | "VerificationNotPassed"
  | "DependencyResolutionFailed"
  | "FileEmissionFailed"
  | "OutputValidationFailed"
  | "WriteError";

/** Error returned when code emission fails. */
export interface EmitterError {
  reason: EmitterErrorReason;
  message: string;
  unitId?: string;
  details?: string[];
}

// ============================================================
// Annotation Types — PRD Section 8.4
// ============================================================

/** A human annotation attached to a generated outline. */
export interface Annotation {
  /** Unique annotation ID. */
  id: string;
  /** The Glass unit this annotation is on. */
  unitId: string;
  /** Target in the outline, e.g. "contract.guarantees.success.2" or "line:15". */
  target: string;
  /** The annotation text. */
  note: string;
  /** Who wrote the annotation. */
  author: string;
  /** When the annotation was created. */
  timestamp: string;
  /** Whether the AI has addressed this annotation. */
  resolved: boolean;
}

// ============================================================
// Glass Config Types
// ============================================================

/** Glass project configuration (glass.config.json). */
export interface GlassConfig {
  /** Project version. */
  version: string;
  /** Target language. */
  language: TargetLanguage;
  /** Project name. */
  projectName: string;
  /** Output directory for compiled code. */
  outputDir: string;
  /** Directory for generated views. */
  generatedDir: string;
  /** Directory for annotation storage. */
  annotationsDir: string;
  /** Entry point Glass unit ID (optional). */
  entryPoint?: string;
  /** Module system for output. */
  moduleSystem?: "commonjs" | "esnext";
}
