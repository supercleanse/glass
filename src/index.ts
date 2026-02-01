/**
 * Glass Framework — AI-authored, human-auditable, formally verified
 *
 * Main entry point for the Glass framework library.
 * Re-exports public API surface for programmatic usage.
 */

export { GlassCompiler } from "./compiler/index";
export { parse } from "./compiler/parser";
export { link } from "./compiler/linker";
export { verify } from "./compiler/verifier";
export { emit } from "./compiler/emitter";

export type {
  GlassNode,
  GlassAST,
  GlassManifest,
  CompilerOptions,
  CompilationResult,
  VerificationResult,
  DiagnosticMessage,
  Severity,
} from "./types/index";

export const VERSION = "0.1.0";
