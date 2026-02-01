/**
 * Glass Framework core type definitions.
 *
 * These types define the structures used throughout the compiler pipeline:
 *   Source Text -> Parser -> AST -> Linker -> Verifier -> Emitter -> Output
 */

/** Severity levels for diagnostic messages emitted by the compiler. */
export type Severity = "error" | "warning" | "info" | "hint";

/** A diagnostic message produced during any phase of compilation. */
export interface DiagnosticMessage {
  severity: Severity;
  code: string;
  message: string;
  file?: string;
  line?: number;
  column?: number;
}

/** Represents a single node in the Glass abstract syntax tree. */
export interface GlassNode {
  kind: string;
  name: string;
  children: GlassNode[];
  metadata: Record<string, unknown>;
  location: SourceLocation;
}

/** Source location tracking for AST nodes. */
export interface SourceLocation {
  file: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

/** The complete abstract syntax tree produced by the parser. */
export interface GlassAST {
  root: GlassNode;
  sourceFiles: string[];
  metadata: Record<string, unknown>;
}

/** Parsed representation of a manifest.glass file. */
export interface GlassManifest {
  name: string;
  version: string;
  language: string;
  created: string;
  origins: ManifestOrigin[];
  policies: ManifestPolicies;
  intentRegistry: IntentRegistry;
}

/** An origin entry in the manifest. */
export interface ManifestOrigin {
  name: string;
  description: string;
  author: string;
  date: string;
}

/** Policy configuration from the manifest. */
export interface ManifestPolicies {
  autoApprove: string[];
  requireApproval: string[];
}

/** Intent tracking registry from the manifest. */
export interface IntentRegistry {
  userOriginated: number;
  conversationDerived: number;
  aiGenerated: number;
}

/** Options passed to the Glass compiler. */
export interface CompilerOptions {
  rootDir: string;
  outDir: string;
  strict: boolean;
  sourceMap: boolean;
  declaration: boolean;
  verbose: boolean;
}

/** The result of a full compilation run. */
export interface CompilationResult {
  success: boolean;
  ast: GlassAST | null;
  diagnostics: DiagnosticMessage[];
  outputFiles: string[];
  duration: number;
}

/** The result of the verification phase. */
export interface VerificationResult {
  valid: boolean;
  diagnostics: DiagnosticMessage[];
  checkedConstraints: number;
  satisfiedConstraints: number;
}
