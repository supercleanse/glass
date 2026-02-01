/**
 * GlassCompiler — orchestrates the full compilation pipeline.
 *
 * Pipeline stages:
 *   1. Parse: source text -> GlassAST
 *   2. Link: resolve cross-references between AST nodes
 *   3. Verify: run formal verification checks against constraints
 *   4. Emit: produce output artifacts (TypeScript, audit logs, annotations)
 */

import { parse } from "./parser";
import { link } from "./linker";
import { verify } from "./verifier";
import { emit } from "./emitter";
import type {
  CompilerOptions,
  CompilationResult,
  DiagnosticMessage,
  GlassAST,
} from "../types/index";

const DEFAULT_OPTIONS: CompilerOptions = {
  rootDir: "src",
  outDir: "dist",
  strict: true,
  sourceMap: true,
  declaration: true,
  verbose: false,
};

export class GlassCompiler {
  private options: CompilerOptions;

  constructor(options: Partial<CompilerOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Run the full compilation pipeline on the given source files.
   *
   * @param sourceFiles - Array of file paths to compile
   * @returns CompilationResult with diagnostics and output file list
   */
  async compile(sourceFiles: string[]): Promise<CompilationResult> {
    const startTime = Date.now();
    const diagnostics: DiagnosticMessage[] = [];
    let ast: GlassAST | null = null;

    try {
      // Stage 1: Parse
      const parseResult = parse(sourceFiles);
      diagnostics.push(...parseResult.diagnostics);
      if (!parseResult.ast) {
        return this.buildResult(false, null, diagnostics, [], startTime);
      }
      ast = parseResult.ast;

      // Stage 2: Link
      const linkResult = link(ast);
      diagnostics.push(...linkResult.diagnostics);
      if (!linkResult.success) {
        return this.buildResult(false, ast, diagnostics, [], startTime);
      }
      ast = linkResult.ast;

      // Stage 3: Verify
      const verifyResult = verify(ast, this.options);
      diagnostics.push(...verifyResult.diagnostics);
      if (!verifyResult.valid) {
        return this.buildResult(false, ast, diagnostics, [], startTime);
      }

      // Stage 4: Emit
      const emitResult = emit(ast, this.options);
      diagnostics.push(...emitResult.diagnostics);

      return this.buildResult(
        emitResult.success,
        ast,
        diagnostics,
        emitResult.outputFiles,
        startTime,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      diagnostics.push({
        severity: "error",
        code: "GLASS_INTERNAL",
        message: `Internal compiler error: ${message}`,
      });
      return this.buildResult(false, ast, diagnostics, [], startTime);
    }
  }

  /** Return the current compiler options. */
  getOptions(): CompilerOptions {
    return { ...this.options };
  }

  private buildResult(
    success: boolean,
    ast: GlassAST | null,
    diagnostics: DiagnosticMessage[],
    outputFiles: string[],
    startTime: number,
  ): CompilationResult {
    return {
      success,
      ast,
      diagnostics,
      outputFiles,
      duration: Date.now() - startTime,
    };
  }
}
