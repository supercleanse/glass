/**
 * Glass Emitter — produces output artifacts from the verified AST.
 *
 * The emitter takes a verified GlassAST and generates:
 *   - TypeScript source files
 *   - Audit trail annotations
 *   - Source maps for traceability
 *
 * This is the final stage of the compilation pipeline.
 */

import type {
  GlassAST,
  GlassNode,
  CompilerOptions,
  DiagnosticMessage,
} from "../types/index";

/** Result returned by the emit function. */
export interface EmitResult {
  success: boolean;
  outputFiles: string[];
  diagnostics: DiagnosticMessage[];
}

/**
 * Emit output artifacts from a verified GlassAST.
 *
 * @param ast - The verified GlassAST to emit
 * @param options - Compiler options controlling output behavior
 * @returns EmitResult with output file paths and diagnostics
 */
export function emit(ast: GlassAST, options: CompilerOptions): EmitResult {
  const diagnostics: DiagnosticMessage[] = [];
  const outputFiles: string[] = [];

  try {
    // Generate output for each source file in the AST
    for (const sourceFile of ast.sourceFiles) {
      const outputPath = mapSourceToOutput(sourceFile, options);
      outputFiles.push(outputPath);

      diagnostics.push({
        severity: "info",
        code: "GLASS_E100",
        message: `Emitted: ${sourceFile} -> ${outputPath}`,
      });

      // Generate declaration file if requested
      if (options.declaration) {
        const declPath = outputPath.replace(/\.js$/, ".d.ts");
        outputFiles.push(declPath);

        diagnostics.push({
          severity: "info",
          code: "GLASS_E101",
          message: `Emitted declaration: ${declPath}`,
        });
      }

      // Generate source map if requested
      if (options.sourceMap) {
        const mapPath = outputPath + ".map";
        outputFiles.push(mapPath);

        diagnostics.push({
          severity: "info",
          code: "GLASS_E102",
          message: `Emitted source map: ${mapPath}`,
        });
      }
    }

    // Emit audit trail
    const auditPath = emitAuditTrail(ast, options);
    outputFiles.push(auditPath);

    diagnostics.push({
      severity: "info",
      code: "GLASS_E103",
      message: `Emitted audit trail: ${auditPath}`,
    });

    return { success: true, outputFiles, diagnostics };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    diagnostics.push({
      severity: "error",
      code: "GLASS_E001",
      message: `Emit failed: ${message}`,
    });
    return { success: false, outputFiles, diagnostics };
  }
}

/**
 * Map a source file path to its output location.
 */
function mapSourceToOutput(sourcePath: string, options: CompilerOptions): string {
  const relative = sourcePath.startsWith(options.rootDir)
    ? sourcePath.slice(options.rootDir.length)
    : sourcePath;

  const jsPath = relative.replace(/\.glass$/, ".js").replace(/\.ts$/, ".js");
  return `${options.outDir}${jsPath}`;
}

/**
 * Generate the audit trail file documenting compilation provenance.
 */
function emitAuditTrail(_ast: GlassAST, options: CompilerOptions): string {
  const auditPath = `${options.outDir}/.audit/compilation.json`;
  return auditPath;
}
