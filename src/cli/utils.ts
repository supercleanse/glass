/**
 * Shared CLI utilities — .glass file discovery, project validation, output formatting.
 */

import * as fs from "fs";
import * as path from "path";
import { parseGlassFile } from "../compiler/parser";
import { linkIntentTree } from "../compiler/linker";
import { verifyAll } from "../compiler/verifier";
import type { GlassFile, GlassConfig, IntentTree, VerificationResult, Result } from "../types/index";
import { Ok, Err, collectResults } from "../types/index";

export interface ProjectContext {
  rootDir: string;
  glassFiles: GlassFile[];
  tree: IntentTree;
  verificationResults: Map<string, VerificationResult>;
}

/**
 * Load glass.config.json from a project root directory.
 */
export function loadGlassConfig(projectRoot: string): GlassConfig | null {
  const configPath = path.join(projectRoot, "glass.config.json");
  if (!fs.existsSync(configPath)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return raw as GlassConfig;
  } catch {
    return null;
  }
}

/**
 * Resolve the glass spec directory from config, with fallback.
 */
export function resolveGlassDir(projectRoot: string, config: GlassConfig | null): string {
  return path.resolve(projectRoot, config?.glassDir ?? "glass");
}

/**
 * Resolve the implementation source directory from config, with fallback.
 */
export function resolveSourceDir(projectRoot: string, config: GlassConfig | null): string {
  return path.resolve(projectRoot, config?.sourceDir ?? "src");
}

/**
 * Discover all .glass files recursively in a directory.
 */
export function discoverGlassFiles(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== "glass-views") {
      files.push(...discoverGlassFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".glass") && entry.name !== "manifest.glass") {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Load and parse all .glass files, link the intent tree, and verify contracts.
 *
 * @param glassDir - Directory containing .glass spec files
 * @param projectRoot - Project root directory (defaults to cwd)
 * @param sourceDir - Directory containing implementation .ts/.rs files (for cross-directory resolution)
 */
export function loadProject(
  glassDir: string,
  projectRoot?: string,
  sourceDir?: string,
): Result<ProjectContext, string> {
  let filePaths = discoverGlassFiles(glassDir);
  let effectiveSourceDir = sourceDir;

  // Backward compatibility: if no .glass files in glassDir, try sourceDir (legacy co-located layout)
  if (filePaths.length === 0 && sourceDir) {
    filePaths = discoverGlassFiles(sourceDir);
    if (filePaths.length > 0) {
      // Legacy layout: .glass files co-located with .ts files — no cross-directory mapping needed
      effectiveSourceDir = undefined;
    }
  }

  if (filePaths.length === 0) {
    return Err("No .glass files found in " + glassDir);
  }

  // Parse all files
  const resolvedGlassDir = path.resolve(glassDir);
  const resolvedSourceDir = effectiveSourceDir ? path.resolve(effectiveSourceDir) : undefined;
  const parseResults = filePaths.map((fp) =>
    parseGlassFile(fp, { glassRoot: resolvedGlassDir, sourceDir: resolvedSourceDir }),
  );
  const parsed: GlassFile[] = [];
  for (const r of parseResults) {
    if (!r.ok) {
      return Err("Parse error: " + r.error.message);
    }
    parsed.push(r.value);
  }

  // Link intent tree
  const treeResult = linkIntentTree(parsed);
  if (!treeResult.ok) {
    return Err("Link error: " + treeResult.error.message);
  }

  // Verify contracts using batch AST analysis (Phase 2)
  const root = projectRoot ?? process.cwd();
  const verificationResults = verifyAll(parsed, root);

  return Ok({
    rootDir: glassDir,
    glassFiles: parsed,
    tree: treeResult.value,
    verificationResults,
  });
}
