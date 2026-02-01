/**
 * Glass Framework — AI-authored, human-auditable, formally verified
 *
 * Main entry point for the Glass framework library.
 * Re-exports public API surface for programmatic usage.
 */

// Compiler
export { GlassCompiler } from "./compiler/index";

// Parser
export { parseGlassFile, parseGlassContent } from "./compiler/parser";

// Linker
export { linkIntentTree, getAncestors, getChildren } from "./compiler/linker";

// Verifier
export { verifyContract, verifyAll } from "./compiler/verifier";

// Emitter
export { emitTypeScript } from "./compiler/emitter";

// Types — re-export everything
export type {
  // Result
  Result,

  // Glass file types
  GlassFile,
  TargetLanguage,

  // Intent types
  Intent,
  IntentSource,
  Stakeholder,
  ApprovalStatus,
  SubIntentRef,

  // Contract types
  Contract,
  ContractAssertion,
  FailureMode,
  Advisory,

  // Manifest types
  Manifest,
  ManifestOrigin,
  ApprovalPolicies,
  IntentRegistryCounts,

  // Verification types
  VerificationResult,
  VerificationAssertion,
  VerificationLevel,

  // Compiler types
  CompilerOptions,
  CompilationResult,
  DiagnosticMessage,
  Severity,

  // Error types
  ParseError,
  ParseErrorReason,
  LinkError,
  EmitterError,
  EmitterErrorReason,

  // Annotation types
  Annotation,

  // Config types
  GlassConfig,
} from "./types/index";

export { Ok, Err, mapResult, flatMapResult, collectResults } from "./types/index";

export const VERSION = "0.1.0";
