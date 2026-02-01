/**
 * Glass Linker — resolves cross-references and dependencies in the AST.
 *
 * After parsing, the AST may contain unresolved references between nodes.
 * The linker walks the tree, resolves all references, and reports any
 * unresolvable symbols as diagnostics. This is the second stage of the
 * compilation pipeline.
 */

import type { GlassAST, GlassNode, DiagnosticMessage } from "../types/index";

/** Result returned by the link function. */
export interface LinkResult {
  ast: GlassAST;
  success: boolean;
  diagnostics: DiagnosticMessage[];
}

/**
 * Link cross-references within the given AST.
 *
 * @param ast - The parsed GlassAST to link
 * @returns LinkResult with the linked AST and diagnostics
 */
export function link(ast: GlassAST): LinkResult {
  const diagnostics: DiagnosticMessage[] = [];
  const symbolTable = new Map<string, GlassNode>();

  // Phase 1: Build symbol table
  collectSymbols(ast.root, symbolTable);

  diagnostics.push({
    severity: "info",
    code: "GLASS_L100",
    message: `Linker collected ${symbolTable.size} symbol(s)`,
  });

  // Phase 2: Resolve references
  const unresolvedCount = resolveReferences(ast.root, symbolTable, diagnostics);

  const success = unresolvedCount === 0;

  if (success) {
    diagnostics.push({
      severity: "info",
      code: "GLASS_L101",
      message: "All references resolved successfully",
    });
  }

  // Mark the AST as linked
  ast.metadata.linked = true;
  ast.metadata.symbolCount = symbolTable.size;

  return { ast, success, diagnostics };
}

/**
 * Recursively collect symbols from AST nodes into the symbol table.
 */
function collectSymbols(node: GlassNode, symbolTable: Map<string, GlassNode>): void {
  if (node.name && node.kind !== "Program") {
    symbolTable.set(node.name, node);
  }
  for (const child of node.children) {
    collectSymbols(child, symbolTable);
  }
}

/**
 * Walk the AST and resolve any reference nodes against the symbol table.
 * Returns the number of unresolved references.
 */
function resolveReferences(
  node: GlassNode,
  symbolTable: Map<string, GlassNode>,
  diagnostics: DiagnosticMessage[],
): number {
  let unresolved = 0;

  if (node.kind === "Reference" && typeof node.metadata.target === "string") {
    const target = node.metadata.target;
    if (!symbolTable.has(target)) {
      diagnostics.push({
        severity: "error",
        code: "GLASS_L001",
        message: `Unresolved reference: "${target}"`,
        file: node.location.file,
        line: node.location.startLine,
        column: node.location.startColumn,
      });
      unresolved++;
    } else {
      node.metadata.resolved = true;
    }
  }

  for (const child of node.children) {
    unresolved += resolveReferences(child, symbolTable, diagnostics);
  }

  return unresolved;
}
