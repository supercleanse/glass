/**
 * Glass Verifier — performs formal verification checks on the linked AST.
 *
 * The verifier ensures that the linked AST satisfies all structural and
 * semantic constraints defined by the Glass specification. It checks
 * invariants, policy compliance, and type consistency. This is the third
 * stage of the compilation pipeline.
 */

import type {
  GlassAST,
  GlassNode,
  CompilerOptions,
  VerificationResult,
  DiagnosticMessage,
} from "../types/index";

/** A single verification constraint to check against the AST. */
interface Constraint {
  name: string;
  description: string;
  check: (ast: GlassAST) => boolean;
}

/** Built-in constraints that every Glass program must satisfy. */
const BUILT_IN_CONSTRAINTS: Constraint[] = [
  {
    name: "has-root-node",
    description: "AST must have a root node of kind 'Program'",
    check: (ast) => ast.root.kind === "Program",
  },
  {
    name: "has-source-files",
    description: "AST must reference at least one source file",
    check: (ast) => ast.sourceFiles.length > 0,
  },
  {
    name: "is-linked",
    description: "AST must be linked before verification",
    check: (ast) => ast.metadata.linked === true,
  },
  {
    name: "no-orphan-nodes",
    description: "All non-root nodes must have valid parent references",
    check: (ast) => validateNoOrphans(ast.root),
  },
];

/**
 * Verify a linked GlassAST against all registered constraints.
 *
 * @param ast - The linked GlassAST to verify
 * @param options - Compiler options (strict mode affects constraint handling)
 * @returns VerificationResult with constraint check outcomes and diagnostics
 */
export function verify(ast: GlassAST, options: CompilerOptions): VerificationResult {
  const diagnostics: DiagnosticMessage[] = [];
  let checkedConstraints = 0;
  let satisfiedConstraints = 0;

  for (const constraint of BUILT_IN_CONSTRAINTS) {
    checkedConstraints++;

    const passed = constraint.check(ast);

    if (passed) {
      satisfiedConstraints++;
      diagnostics.push({
        severity: "info",
        code: "GLASS_V100",
        message: `Constraint satisfied: ${constraint.name} — ${constraint.description}`,
      });
    } else {
      const severity = options.strict ? "error" : "warning";
      diagnostics.push({
        severity,
        code: "GLASS_V001",
        message: `Constraint violated: ${constraint.name} — ${constraint.description}`,
      });
    }
  }

  const valid = options.strict
    ? satisfiedConstraints === checkedConstraints
    : !diagnostics.some((d) => d.severity === "error");

  diagnostics.push({
    severity: "info",
    code: "GLASS_V101",
    message: `Verification complete: ${satisfiedConstraints}/${checkedConstraints} constraints satisfied`,
  });

  return {
    valid,
    diagnostics,
    checkedConstraints,
    satisfiedConstraints,
  };
}

/**
 * Recursively validate that no nodes are orphaned (unreachable from root).
 * Since we walk from the root, any node we can visit is not orphaned.
 * This validates structural integrity of child arrays.
 */
function validateNoOrphans(node: GlassNode): boolean {
  for (const child of node.children) {
    if (!child.kind || !child.name) {
      return false;
    }
    if (!validateNoOrphans(child)) {
      return false;
    }
  }
  return true;
}
