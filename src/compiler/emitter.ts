/**
 * Glass TypeScript Emitter — outputs clean, standard TypeScript code
 * from verified .glass files.
 *
 * This is the fourth and final stage of the Glass compiler pipeline.
 */

import type {
  GlassFile,
  VerificationResult,
  EmitterError,
  Result,
  CompilerOptions,
  DiagnosticMessage,
} from "../types/index";
import { Ok, Err } from "../types/index";

/** Result of emitting code for a project. */
export interface EmitResult {
  success: boolean;
  outputFiles: string[];
  diagnostics: DiagnosticMessage[];
}

/**
 * Emit TypeScript code from verified GlassFiles.
 * Refuses to emit if any verification has failed.
 */
export function emitTypeScript(
  files: GlassFile[],
  verificationResults: Map<string, VerificationResult>,
  outputDir: string,
): Result<string[], EmitterError> {
  // Verify all files have passing verification
  for (const file of files) {
    const result = verificationResults.get(file.id);
    if (!result) {
      return Err({
        reason: "VerificationNotPassed",
        message: "No verification result for unit: " + file.id,
        unitId: file.id,
      });
    }
    if (result.status === "FAILED") {
      return Err({
        reason: "VerificationNotPassed",
        message: "Verification failed for unit: " + file.id,
        unitId: file.id,
      });
    }
  }

  // Emit each file
  const outputFiles: string[] = [];
  for (const file of files) {
    const outputPath = mapGlassIdToPath(file.id, outputDir);
    outputFiles.push(outputPath);
    // Actual file writing will be implemented in Task 9
  }

  return Ok(outputFiles);
}

/**
 * Convert a Glass unit ID to an output file path.
 * e.g. "auth.authenticate_user" -> "dist/auth/authenticate_user.ts"
 */
function mapGlassIdToPath(id: string, outputDir: string): string {
  const parts = id.split(".");
  const fileName = parts.pop() + ".ts";
  const dirParts = parts;
  return [outputDir, ...dirParts, fileName].join("/");
}

// Re-export for backward compat with Task 1 scaffold
export function emit(_ast: unknown, _options: CompilerOptions): EmitResult {
  return {
    success: true,
    outputFiles: [],
    diagnostics: [
      { severity: "info" as const, code: "GLASS_E100", message: "Emitter initialized" },
    ],
  };
}
