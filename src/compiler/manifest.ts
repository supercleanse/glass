/**
 * Glass Manifest Parser and Manager — parses, validates, and manages
 * the manifest.glass living requirements document.
 *
 * Implements PRD Section 6: tracks requirement origins, approval policies,
 * and intent registry statistics.
 */

import * as fs from "fs";
import type {
  Manifest,
  ManifestOrigin,
  ApprovalPolicies,
  IntentRegistryCounts,
  TargetLanguage,
  Result,
} from "../types/index";
import { Ok, Err } from "../types/index";

// ============================================================
// Manifest Error Types
// ============================================================

export interface ManifestError {
  reason: "FileNotFound" | "InvalidFormat" | "MissingField" | "InvalidVersion";
  message: string;
  filePath?: string;
}

// ============================================================
// Manifest Parser
// ============================================================

/**
 * Parse a manifest.glass file from a file path.
 */
export function parseManifest(filePath: string): Result<Manifest, ManifestError> {
  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return Err({
      reason: "FileNotFound",
      message: "Manifest file not found: " + filePath,
      filePath,
    });
  }

  return parseManifestContent(content, filePath);
}

/**
 * Parse manifest content from a string.
 */
export function parseManifestContent(
  content: string,
  filePath: string = "manifest.glass",
): Result<Manifest, ManifestError> {
  const lines = content.split(/\r?\n/);

  // Parse header fields
  const headerFields = new Map<string, string>();
  let lineIdx = 0;

  for (; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx].trim();
    if (!line) continue;

    // Stop at section headers
    if (line.endsWith(":") && !line.startsWith("→") && !line.startsWith("-")) {
      const label = line.slice(0, -1).trim().toLowerCase();
      if (label === "origins" || label === "policies" || label === "intent registry") {
        break;
      }
    }

    // Parse "Key: Value" pairs
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim().toLowerCase().replace(/\s+/g, "_");
      const value = line.slice(colonIdx + 1).trim().replace(/^"|"$/g, "");
      headerFields.set(key, value);
    }
  }

  // Validate required fields
  const projectName = headerFields.get("glass_manifest");
  if (!projectName) {
    return Err({
      reason: "MissingField",
      message: "Manifest missing 'Glass Manifest: <name>' header",
      filePath,
    });
  }

  const version = headerFields.get("version") || "0.1.0";
  const language = (headerFields.get("language") || "typescript").toLowerCase() as TargetLanguage;
  const created = headerFields.get("created") || new Date().toISOString().split("T")[0];

  // Parse Origins section
  const origins = parseOriginsSection(lines, lineIdx);
  lineIdx = origins.nextIdx;

  // Parse Policies section
  const policies = parsePoliciesSection(lines, lineIdx);
  lineIdx = policies.nextIdx;

  // Parse Intent Registry section
  const intentRegistry = parseIntentRegistrySection(lines, lineIdx);

  return Ok({
    projectName,
    version,
    language,
    created,
    origins: origins.value,
    policies: policies.value,
    intentRegistry: intentRegistry.value,
  });
}

// ============================================================
// Section Parsers
// ============================================================

function parseOriginsSection(
  lines: string[],
  startIdx: number,
): { value: ManifestOrigin[]; nextIdx: number } {
  const origins: ManifestOrigin[] = [];
  let i = startIdx;

  // Find "Origins:" header
  for (; i < lines.length; i++) {
    if (lines[i].trim().toLowerCase() === "origins:") {
      i++;
      break;
    }
  }

  // Parse origin entries
  let currentOrigin: Partial<ManifestOrigin> | null = null;

  for (; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Stop at next section
    if (trimmed && !trimmed.startsWith("→") && !trimmed.startsWith("-") && !line.startsWith("  ")) {
      if (trimmed.toLowerCase() === "policies:" || trimmed.toLowerCase() === "intent registry:") {
        break;
      }
    }

    if (!trimmed) continue;

    // Entry line: "  Type: Description"
    if (line.startsWith("  ") && !line.startsWith("    ") && !trimmed.startsWith("→")) {
      if (currentOrigin && currentOrigin.kind && currentOrigin.name) {
        origins.push(currentOrigin as ManifestOrigin);
      }

      const colonIdx = trimmed.indexOf(":");
      if (colonIdx > 0) {
        const kindStr = trimmed.slice(0, colonIdx).trim().toLowerCase();
        const description = trimmed.slice(colonIdx + 1).trim().replace(/^"|"$/g, "");
        const kind = kindStr === "prd" ? "prd"
          : kindStr === "conversation" ? "conversation"
          : "ai-generated";
        currentOrigin = {
          kind,
          name: kindStr,
          description,
          author: "unknown",
          date: "",
        };
      }
    }

    // Detail line: "    → authored by X, date"
    if (trimmed.startsWith("→") && currentOrigin) {
      const detail = trimmed.slice(1).trim();
      const authorMatch = detail.match(/(?:authored|created|generated)\s+by\s+(\w+),?\s*(.*)/i);
      if (authorMatch) {
        currentOrigin.author = authorMatch[1];
        currentOrigin.date = authorMatch[2] || "";
      }
    }
  }

  // Save last origin
  if (currentOrigin && currentOrigin.kind && currentOrigin.name) {
    origins.push(currentOrigin as ManifestOrigin);
  }

  return { value: origins, nextIdx: i };
}

function parsePoliciesSection(
  lines: string[],
  startIdx: number,
): { value: ApprovalPolicies; nextIdx: number } {
  const policies: ApprovalPolicies = {
    autoApprove: [],
    requireApproval: [],
  };
  let i = startIdx;

  // Find "Policies:" header
  for (; i < lines.length; i++) {
    if (lines[i].trim().toLowerCase() === "policies:") {
      i++;
      break;
    }
  }

  for (; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    // Stop at next section
    if (!lines[i].startsWith("  ") && trimmed.toLowerCase() === "intent registry:") {
      break;
    }

    const match = trimmed.match(/^(auto[_-]approve|require[_-]approval):\s*(.+)/i);
    if (match) {
      const key = match[1].toLowerCase().replace(/[-_]/g, "");
      const values = match[2].split(",").map((v) => v.trim()).filter(Boolean);
      if (key === "autoapprove") {
        policies.autoApprove = values;
      } else if (key === "requireapproval") {
        policies.requireApproval = values;
      }
    }
  }

  return { value: policies, nextIdx: i };
}

function parseIntentRegistrySection(
  lines: string[],
  startIdx: number,
): { value: IntentRegistryCounts; nextIdx: number } {
  const counts: IntentRegistryCounts = {
    userOriginated: 0,
    conversationDerived: 0,
    aiGenerated: 0,
  };
  let i = startIdx;

  // Find "Intent Registry:" header
  for (; i < lines.length; i++) {
    if (lines[i].trim().toLowerCase() === "intent registry:") {
      i++;
      break;
    }
  }

  for (; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    const countMatch = trimmed.match(/^([\w-]+):\s*(\d+)\s*intents?/i);
    if (countMatch) {
      const key = countMatch[1].toLowerCase().replace(/[-_]/g, "");
      const count = parseInt(countMatch[2], 10);
      if (key === "useroriginated") counts.userOriginated = count;
      else if (key === "conversationderived") counts.conversationDerived = count;
      else if (key === "aigenerated") counts.aiGenerated = count;
    }
  }

  return { value: counts, nextIdx: i };
}

// ============================================================
// Manifest Serializer
// ============================================================

/**
 * Serialize a Manifest object back to manifest.glass format.
 */
export function serializeManifest(manifest: Manifest): string {
  const lines: string[] = [];

  // Header
  lines.push("Glass Manifest: " + manifest.projectName);
  lines.push("Version: " + manifest.version);
  lines.push("Language: " + manifest.language.charAt(0).toUpperCase() + manifest.language.slice(1));
  lines.push("Created: " + manifest.created);
  lines.push("");

  // Origins
  lines.push("Origins:");
  for (const origin of manifest.origins) {
    lines.push('  ' + origin.name + ': "' + origin.description + '"');
    if (origin.author || origin.date) {
      lines.push("    → authored by " + origin.author + (origin.date ? ", " + origin.date : ""));
    }
  }
  lines.push("");

  // Policies
  lines.push("Policies:");
  if (manifest.policies.autoApprove.length > 0) {
    lines.push("  auto-approve: " + manifest.policies.autoApprove.join(", "));
  }
  if (manifest.policies.requireApproval.length > 0) {
    lines.push("  require-approval: " + manifest.policies.requireApproval.join(", "));
  }
  lines.push("");

  // Intent Registry
  lines.push("Intent Registry:");
  lines.push("  user-originated: " + manifest.intentRegistry.userOriginated + " intents");
  lines.push("  conversation-derived: " + manifest.intentRegistry.conversationDerived + " intents");
  lines.push("  ai-generated: " + manifest.intentRegistry.aiGenerated + " intents");
  lines.push("");

  return lines.join("\n");
}

// ============================================================
// Manifest Manager
// ============================================================

/**
 * ManifestManager provides CRUD operations on the manifest.
 */
export class ManifestManager {
  private manifest: Manifest;
  private filePath: string;

  constructor(manifest: Manifest, filePath: string) {
    this.manifest = manifest;
    this.filePath = filePath;
  }

  /** Load a ManifestManager from a file path. */
  static load(filePath: string): Result<ManifestManager, ManifestError> {
    const result = parseManifest(filePath);
    if (!result.ok) return result;
    return Ok(new ManifestManager(result.value, filePath));
  }

  /** Get the current manifest. */
  getManifest(): Manifest {
    return this.manifest;
  }

  /** Add an origin entry. */
  addOrigin(origin: ManifestOrigin): void {
    this.manifest.origins.push(origin);
  }

  /** Update intent registry counts. */
  updateIntentRegistry(counts: Partial<IntentRegistryCounts>): void {
    if (counts.userOriginated !== undefined) {
      this.manifest.intentRegistry.userOriginated = counts.userOriginated;
    }
    if (counts.conversationDerived !== undefined) {
      this.manifest.intentRegistry.conversationDerived = counts.conversationDerived;
    }
    if (counts.aiGenerated !== undefined) {
      this.manifest.intentRegistry.aiGenerated = counts.aiGenerated;
    }
  }

  /** Check the approval policy for a category. */
  getApprovalPolicy(category: string): "auto-approve" | "require-approval" | "unknown" {
    if (this.manifest.policies.autoApprove.includes(category)) return "auto-approve";
    if (this.manifest.policies.requireApproval.includes(category)) return "require-approval";
    return "unknown";
  }

  /** Get all auto-approve categories. */
  getAutoApproveCategories(): string[] {
    return [...this.manifest.policies.autoApprove];
  }

  /** Get all require-approval categories. */
  getRequireApprovalCategories(): string[] {
    return [...this.manifest.policies.requireApproval];
  }

  /** Serialize and save the manifest to disk. */
  save(): Result<void, ManifestError> {
    const content = serializeManifest(this.manifest);
    try {
      fs.writeFileSync(this.filePath, content, "utf-8");
    } catch (err) {
      return Err({
        reason: "InvalidFormat",
        message: "Failed to write manifest: " + String(err),
        filePath: this.filePath,
      });
    }
    return Ok(undefined);
  }
}
