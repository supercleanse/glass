/**
 * Shared CLI utilities — .glass file discovery, project validation, output formatting.
 */

import * as fs from "fs";
import * as path from "path";
import { parseGlassFile } from "../compiler/parser";
import { linkIntentTree } from "../compiler/linker";
import { verifyContract } from "../compiler/verifier";
import type { GlassFile, IntentTree, VerificationResult, Result } from "../types/index";
import { Ok, Err, collectResults } from "../types/index";

export interface ProjectContext {
  rootDir: string;
  glassFiles: GlassFile[];
  tree: IntentTree;
  verificationResults: Map<string, VerificationResult>;
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
    if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== ".generated") {
      files.push(...discoverGlassFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".glass") && entry.name !== "manifest.glass") {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Load and parse all .glass files, link the intent tree, and verify contracts.
 */
export function loadProject(sourceDir: string): Result<ProjectContext, string> {
  const filePaths = discoverGlassFiles(sourceDir);
  if (filePaths.length === 0) {
    return Err("No .glass files found in " + sourceDir);
  }

  // Parse all files
  const parseResults = filePaths.map((fp) => parseGlassFile(fp));
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

  // Verify contracts
  const verificationResults = new Map<string, VerificationResult>();
  for (const file of parsed) {
    verificationResults.set(file.id, verifyContract(file));
  }

  return Ok({
    rootDir: sourceDir,
    glassFiles: parsed,
    tree: treeResult.value,
    verificationResults,
  });
}
