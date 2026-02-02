/**
 * TypeScript Program Factory — creates ts.Program instances from .glass file
 * implementations for Phase 2 AST-based contract verification.
 *
 * Uses the TypeScript Compiler API to enable semantic analysis (type checking,
 * control flow analysis, reference tracking) instead of regex pattern matching.
 */

import * as ts from "typescript";
import * as path from "path";
import * as fs from "fs";
import type { GlassFile } from "../types/index";

// ============================================================
// Caching
// ============================================================

let cachedCompilerOptions: ts.CompilerOptions | null = null;
let cachedDefaultHost: ts.CompilerHost | null = null;

/**
 * Load and cache TypeScript compiler options from tsconfig.json.
 * Falls back to sensible defaults if tsconfig.json is not found.
 */
function getCompilerOptions(projectRoot: string): ts.CompilerOptions {
  if (cachedCompilerOptions) return cachedCompilerOptions;

  const tsconfigPath = path.resolve(projectRoot, "tsconfig.json");
  if (fs.existsSync(tsconfigPath)) {
    const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
    if (!configFile.error) {
      const parsed = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        projectRoot,
      );
      cachedCompilerOptions = parsed.options;
      return cachedCompilerOptions;
    }
  }

  // Fallback defaults matching the project's tsconfig.json
  cachedCompilerOptions = {
    strict: true,
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.Node16,
    moduleResolution: ts.ModuleResolutionKind.Node16,
    esModuleInterop: true,
    skipLibCheck: true,
    declaration: false,
    noEmit: true,
  };
  return cachedCompilerOptions;
}

/**
 * Get or create a default compiler host for file resolution.
 */
function getDefaultHost(options: ts.CompilerOptions): ts.CompilerHost {
  if (cachedDefaultHost) return cachedDefaultHost;
  cachedDefaultHost = ts.createCompilerHost(options);
  return cachedDefaultHost;
}

// ============================================================
// Virtual File System
// ============================================================

/**
 * Generate the virtual file path for a Glass unit's implementation.
 * Uses a prefix that won't collide with real files.
 */
function virtualPath(unitId: string): string {
  return path.resolve("__glass_verify__", unitId.replace(/\./g, "/") + ".ts");
}

/**
 * Try to resolve an import specifier to a real file on disk.
 * Handles relative imports from the Glass unit's original source location.
 */
function resolveImportPath(
  specifier: string,
  glassFilePath: string | undefined,
  projectRoot: string,
): string | undefined {
  if (!specifier.startsWith(".")) return undefined;

  // Resolve relative to the .glass file's directory
  const baseDir = glassFilePath
    ? path.dirname(path.resolve(projectRoot, glassFilePath))
    : path.resolve(projectRoot, "src");

  const resolved = path.resolve(baseDir, specifier);
  const candidates = [
    resolved + ".ts",
    resolved + "/index.ts",
    resolved + ".js",
    resolved + "/index.js",
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return undefined;
}

// ============================================================
// Program Factory
// ============================================================

/**
 * Determine the original source file path for a Glass unit.
 * Used to resolve relative imports correctly.
 */
function inferSourcePath(file: GlassFile, projectRoot: string): string | undefined {
  // Try common patterns based on the unit ID
  const idParts = file.id.split(".");
  const candidates: string[] = [];

  if (idParts.length === 2) {
    const [mod, name] = idParts;
    candidates.push(
      path.join(projectRoot, "src", mod, name + ".ts"),
      path.join(projectRoot, "src", mod, name + ".glass"),
      path.join(projectRoot, "src", mod, "index.ts"),
    );
  }

  // Also try flat patterns
  candidates.push(
    path.join(projectRoot, "src", idParts.join("/") + ".ts"),
    path.join(projectRoot, "src", idParts.join("/") + ".glass"),
  );

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return undefined;
}

/**
 * Extract import specifiers from implementation source text.
 * Returns pairs of [specifier, resolvedPath].
 */
function resolveImplementationImports(
  implementation: string,
  glassFilePath: string | undefined,
  projectRoot: string,
): Map<string, string> {
  const imports = new Map<string, string>();
  const importRegex = /(?:import|from)\s+['"](\.\.?\/[^'"]+)['"]/g;
  let match: RegExpExecArray | null;

  while ((match = importRegex.exec(implementation)) !== null) {
    const specifier = match[1];
    if (imports.has(specifier)) continue;

    const resolved = resolveImportPath(specifier, glassFilePath, projectRoot);
    if (resolved) {
      imports.set(specifier, resolved);
    }
  }

  return imports;
}

/**
 * Create a ts.Program from a GlassFile's implementation section.
 *
 * This enables Phase 2 AST-based verification via the TypeScript type checker.
 * Returns null if the implementation has syntax errors or cannot be compiled.
 */
export function createProgramFromGlassFile(
  file: GlassFile,
  projectRoot: string,
): ts.Program | null {
  const options = getCompilerOptions(projectRoot);
  const defaultHost = getDefaultHost(options);
  const vPath = virtualPath(file.id);
  const sourcePath = inferSourcePath(file, projectRoot);

  // Strip shebang lines which are not valid TypeScript syntax
  let implementation = file.implementation;
  if (implementation.includes("#!")) {
    implementation = implementation.replace(/^[^\n]*#![^\n]*\n/m, "// (shebang removed)\n");
  }

  // Create the in-memory source file
  const sourceFile = ts.createSourceFile(
    vPath,
    implementation,
    options.target ?? ts.ScriptTarget.ES2020,
    true,
    ts.ScriptKind.TS,
  );

  // Resolve imports from the implementation
  const resolvedImports = resolveImplementationImports(
    file.implementation,
    sourcePath,
    projectRoot,
  );

  // Create a custom compiler host that serves our virtual file
  const host: ts.CompilerHost = {
    ...defaultHost,
    getSourceFile(fileName, languageVersionOrOptions) {
      if (fileName === vPath || path.resolve(fileName) === vPath) {
        return sourceFile;
      }
      return defaultHost.getSourceFile(fileName, languageVersionOrOptions);
    },
    fileExists(fileName) {
      if (fileName === vPath || path.resolve(fileName) === vPath) return true;
      return defaultHost.fileExists(fileName);
    },
    readFile(fileName) {
      if (fileName === vPath || path.resolve(fileName) === vPath) {
        return file.implementation;
      }
      return defaultHost.readFile(fileName);
    },
    resolveModuleNameLiterals(
      moduleLiterals: readonly ts.StringLiteralLike[],
      containingFile: string,
      _redirectedReference: ts.ResolvedProjectReference | undefined,
      compilerOptions: ts.CompilerOptions,
    ) {
      return moduleLiterals.map((literal) => {
        const name = literal.text;

        // Check our pre-resolved imports
        const preResolved = resolvedImports.get(name);
        if (preResolved) {
          return {
            resolvedModule: {
              resolvedFileName: preResolved,
              extension: preResolved.endsWith(".ts")
                ? ts.Extension.Ts
                : ts.Extension.Js,
              isExternalLibraryImport: false,
            },
          } as ts.ResolvedModuleWithFailedLookupLocations;
        }

        // Fall back to default resolution
        const result = ts.resolveModuleName(
          name,
          containingFile,
          compilerOptions,
          defaultHost,
        );
        return {
          resolvedModule: result.resolvedModule,
        } as ts.ResolvedModuleWithFailedLookupLocations;
      });
    },
  };

  try {
    const program = ts.createProgram([vPath], { ...options, noEmit: true }, host);

    // Check for fatal syntax errors only (ignore semantic errors from unresolved imports)
    const syntaxDiagnostics = program.getSyntacticDiagnostics(sourceFile);
    if (syntaxDiagnostics.length > 0) {
      return null;
    }

    return program;
  } catch {
    return null;
  }
}

/**
 * Batch-create a single ts.Program containing all Glass file implementations.
 * Much faster than creating individual programs because the type checker,
 * compiler host, and resolved modules are shared.
 *
 * Returns a map from unit ID to the program (same program for all units).
 * Also returns individual source files accessible via getVirtualPath().
 */
export function createBatchProgram(
  files: GlassFile[],
  projectRoot: string,
): { program: ts.Program; sourceFiles: Map<string, ts.SourceFile> } | null {
  const options = getCompilerOptions(projectRoot);
  const defaultHost = getDefaultHost(options);
  const virtualFiles = new Map<string, ts.SourceFile>();
  const virtualPaths: string[] = [];
  const allResolvedImports = new Map<string, string>();

  // Create virtual source files for all units
  for (const file of files) {
    const vPath = virtualPath(file.id);
    const sourcePath = inferSourcePath(file, projectRoot);

    let implementation = file.implementation;
    if (implementation.includes("#!")) {
      implementation = implementation.replace(/^[^\n]*#![^\n]*\n/m, "// (shebang removed)\n");
    }

    const sf = ts.createSourceFile(
      vPath,
      implementation,
      options.target ?? ts.ScriptTarget.ES2020,
      true,
      ts.ScriptKind.TS,
    );

    virtualFiles.set(vPath, sf);
    virtualPaths.push(vPath);

    // Collect imports
    const imports = resolveImplementationImports(implementation, sourcePath, projectRoot);
    for (const [spec, resolved] of imports) {
      allResolvedImports.set(spec, resolved);
    }
  }

  // Create a shared compiler host
  const host: ts.CompilerHost = {
    ...defaultHost,
    getSourceFile(fileName, languageVersionOrOptions) {
      const resolved = path.resolve(fileName);
      const virtual = virtualFiles.get(fileName) || virtualFiles.get(resolved);
      if (virtual) return virtual;
      return defaultHost.getSourceFile(fileName, languageVersionOrOptions);
    },
    fileExists(fileName) {
      const resolved = path.resolve(fileName);
      if (virtualFiles.has(fileName) || virtualFiles.has(resolved)) return true;
      return defaultHost.fileExists(fileName);
    },
    readFile(fileName) {
      const resolved = path.resolve(fileName);
      const virtual = virtualFiles.get(fileName) || virtualFiles.get(resolved);
      if (virtual) return virtual.text;
      return defaultHost.readFile(fileName);
    },
    resolveModuleNameLiterals(
      moduleLiterals: readonly ts.StringLiteralLike[],
      containingFile: string,
      _redirectedReference: ts.ResolvedProjectReference | undefined,
      compilerOptions: ts.CompilerOptions,
    ) {
      return moduleLiterals.map((literal) => {
        const name = literal.text;
        const preResolved = allResolvedImports.get(name);
        if (preResolved) {
          return {
            resolvedModule: {
              resolvedFileName: preResolved,
              extension: preResolved.endsWith(".ts") ? ts.Extension.Ts : ts.Extension.Js,
              isExternalLibraryImport: false,
            },
          } as ts.ResolvedModuleWithFailedLookupLocations;
        }
        const result = ts.resolveModuleName(name, containingFile, compilerOptions, defaultHost);
        return { resolvedModule: result.resolvedModule } as ts.ResolvedModuleWithFailedLookupLocations;
      });
    },
  };

  try {
    const program = ts.createProgram(virtualPaths, { ...options, noEmit: true }, host);
    const sourceFileMap = new Map<string, ts.SourceFile>();
    for (const file of files) {
      const vPath = virtualPath(file.id);
      const sf = program.getSourceFile(vPath);
      if (sf) sourceFileMap.set(file.id, sf);
    }
    return { program, sourceFiles: sourceFileMap };
  } catch {
    return null;
  }
}

/**
 * Batch-create programs for multiple Glass files (legacy API).
 * Internally uses createBatchProgram for performance.
 */
export function createProgramsForFiles(
  files: GlassFile[],
  projectRoot: string,
): Map<string, ts.Program> {
  const batch = createBatchProgram(files, projectRoot);
  if (!batch) return new Map();

  const programs = new Map<string, ts.Program>();
  for (const [unitId] of batch.sourceFiles) {
    programs.set(unitId, batch.program);
  }
  return programs;
}

/**
 * Reset the cached compiler options and host.
 * Useful for testing or when project config changes.
 */
export function resetCache(): void {
  cachedCompilerOptions = null;
  cachedDefaultHost = null;
}

/**
 * Get the virtual file path for a Glass unit ID.
 * Exported for use by verification functions that need to
 * retrieve the source file from the program.
 */
export function getVirtualPath(unitId: string): string {
  return virtualPath(unitId);
}
