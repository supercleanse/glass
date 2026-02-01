/**
 * Glass File Parser — reads .glass files and extracts intent, contract,
 * and implementation sections into typed GlassFile objects.
 *
 * This is the first stage of the Glass compiler pipeline.
 */

import type { GlassFile, ParseError, Result } from "../types/index";
import { Ok, Err } from "../types/index";

/** Section markers in the .glass file format. */
const SECTION_MARKERS = [
  "=== Glass Unit ===",
  "=== Intent ===",
  "=== Contract ===",
  "=== Implementation ===",
] as const;

/** Raw sections extracted from a .glass file before parsing. */
interface RawSections {
  glassUnit: { content: string; startLine: number };
  intent: { content: string; startLine: number };
  contract: { content: string; startLine: number };
  implementation: { content: string; startLine: number };
}

/**
 * Parse a .glass file from a file path.
 */
export function parseGlassFile(filePath: string): Result<GlassFile, ParseError> {
  // Will be implemented in Task 4 with full file I/O
  return Err({
    reason: "FileNotFound",
    message: "Parser not yet implemented — see Task 4",
    filePath,
  });
}

/**
 * Parse .glass content from a string.
 */
export function parseGlassContent(
  content: string,
  filePath: string,
): Result<GlassFile, ParseError> {
  // Split into sections
  const sections = splitSections(content, filePath);
  if (!sections.ok) {
    return sections;
  }

  // Parse each section (stubs — will be implemented in Task 4)
  return Err({
    reason: "InvalidFormat",
    message: "Content parsing not yet implemented — see Task 4",
    filePath,
  });
}

/**
 * Split raw .glass file content by section markers.
 */
function splitSections(content: string, filePath: string): Result<RawSections, ParseError> {
  const lines = content.split(/\r?\n/);
  const sectionStarts: { marker: string; line: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (SECTION_MARKERS.includes(trimmed as typeof SECTION_MARKERS[number])) {
      sectionStarts.push({ marker: trimmed, line: i + 1 });
    }
  }

  // Validate all four sections present
  for (const expected of SECTION_MARKERS) {
    if (!sectionStarts.find((s) => s.marker === expected)) {
      return Err({
        reason: "MissingSection",
        message: "Missing section: " + expected,
        filePath,
        section: expected.replace(/^=== | ===$/g, "") as ParseError["section"],
      });
    }
  }

  // Extract content between markers
  const getContent = (markerIdx: number): { content: string; startLine: number } => {
    const start = sectionStarts[markerIdx].line;
    const end = markerIdx + 1 < sectionStarts.length
      ? sectionStarts[markerIdx + 1].line - 1
      : lines.length;
    return {
      content: lines.slice(start, end).join("\n").trim(),
      startLine: start + 1,
    };
  };

  return Ok({
    glassUnit: getContent(0),
    intent: getContent(1),
    contract: getContent(2),
    implementation: getContent(3),
  });
}

// Re-export for backward compat with Task 1 scaffold
export function parse(_sources: string[]) {
  return {
    ast: null,
    diagnostics: [{ severity: "info" as const, code: "GLASS_P100", message: "Parser initialized" }],
  };
}
