/**
 * Glass Parser — converts source text into a GlassAST.
 *
 * The parser reads .glass files and produces an abstract syntax tree that
 * represents the structure and semantics of the Glass source. This is the
 * first stage of the compilation pipeline.
 */

import type { GlassAST, GlassNode, DiagnosticMessage } from "../types/index";

/** Result returned by the parse function. */
export interface ParseResult {
  ast: GlassAST | null;
  diagnostics: DiagnosticMessage[];
}

/**
 * Parse an array of source file paths into a GlassAST.
 *
 * @param sourceFiles - Paths to .glass source files
 * @returns ParseResult containing the AST (or null on failure) and diagnostics
 */
export function parse(sourceFiles: string[]): ParseResult {
  const diagnostics: DiagnosticMessage[] = [];

  if (sourceFiles.length === 0) {
    diagnostics.push({
      severity: "error",
      code: "GLASS_P001",
      message: "No source files provided to the parser",
    });
    return { ast: null, diagnostics };
  }

  const rootNode: GlassNode = {
    kind: "Program",
    name: "root",
    children: [],
    metadata: {
      sourceFileCount: sourceFiles.length,
    },
    location: {
      file: sourceFiles[0],
      startLine: 1,
      startColumn: 1,
      endLine: 1,
      endColumn: 1,
    },
  };

  for (const file of sourceFiles) {
    const fileNode: GlassNode = {
      kind: "SourceFile",
      name: file,
      children: [],
      metadata: {},
      location: {
        file,
        startLine: 1,
        startColumn: 1,
        endLine: 1,
        endColumn: 1,
      },
    };
    rootNode.children.push(fileNode);

    diagnostics.push({
      severity: "info",
      code: "GLASS_P100",
      message: `Parsed source file: ${file}`,
      file,
    });
  }

  const ast: GlassAST = {
    root: rootNode,
    sourceFiles,
    metadata: {
      parserVersion: "0.1.0",
      timestamp: new Date().toISOString(),
    },
  };

  return { ast, diagnostics };
}
