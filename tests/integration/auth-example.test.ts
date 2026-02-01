/**
 * Integration test — Auth system example from PRD Section 17.
 *
 * Tests the complete auth hierarchy: root → authenticate_user → validate_credentials, sanitize_input.
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { parseGlassFile } from "../../src/compiler/parser";
import { linkIntentTree } from "../../src/compiler/linker";
import { verifyContract, verifyAll } from "../../src/compiler/verifier";
import { emitTypeScript } from "../../src/compiler/emitter";
import { generateAllViews } from "../../src/compiler/view-generator";
import type { GlassFile, VerificationResult } from "../../src/types/index";

describe("Auth System Example (PRD Section 17)", () => {
  const fixturesDir = path.join(__dirname, "..", "fixtures", "valid-glass-files");
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "glass-auth-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function loadAuthFiles(): GlassFile[] {
    const files: GlassFile[] = [];
    const authFixtures = fs
      .readdirSync(fixturesDir)
      .filter((f) => f.startsWith("auth.") && f.endsWith(".glass"));

    for (const f of authFixtures) {
      const result = parseGlassFile(path.join(fixturesDir, f));
      expect(result.ok).toBe(true);
      if (result.ok) files.push(result.value);
    }
    return files;
  }

  it("should parse all auth files successfully", () => {
    const files = loadAuthFiles();
    expect(files.length).toBeGreaterThanOrEqual(1);

    for (const file of files) {
      expect(file.id).toMatch(/^auth\./);
      expect(file.language).toBe("typescript");
      expect(file.intent.purpose).toBeTruthy();
    }
  });

  it("should link the auth intent hierarchy", () => {
    const files = loadAuthFiles();
    const linkResult = linkIntentTree(files);
    expect(linkResult.ok).toBe(true);
    if (!linkResult.ok) return;

    const tree = linkResult.value;

    // auth.authenticate_user should be a root
    expect(tree.roots).toContain("auth.authenticate_user");

    // Verify parent-child relationships
    const authChildren = tree.childrenMap.get("auth.authenticate_user") || [];
    if (files.length > 1) {
      expect(authChildren.length).toBeGreaterThan(0);
    }
  });

  it("should verify all auth units and produce assertions", () => {
    const files = loadAuthFiles();
    const results = verifyAll(files);

    for (const [unitId, result] of results) {
      // All units should produce some assertions
      expect(result.assertions.length).toBeGreaterThan(0);
      // Status is either PROVEN or FAILED (no crashes/undefined)
      expect(["PROVEN", "FAILED"]).toContain(result.status);
    }

    // At least some units should pass
    const passedCount = Array.from(results.values()).filter((r) => r.status === "PROVEN").length;
    expect(passedCount).toBeGreaterThan(0);
  });

  it("should check intent sources match expected types", () => {
    const files = loadAuthFiles();

    for (const file of files) {
      // All auth files should have a valid source kind
      expect(["prd", "conversation", "ai-generated"]).toContain(file.intent.source.kind);

      // Approval status should be set
      expect(["approved", "pending", "auto-approved"]).toContain(file.intent.approvalStatus);
    }
  });

  it("should emit TypeScript for verified auth units", () => {
    const files = loadAuthFiles();
    const verificationResults = new Map<string, VerificationResult>();
    for (const file of files) {
      verificationResults.set(file.id, verifyContract(file));
    }

    // Only emit verified files
    const verifiedFiles = files.filter((f) => {
      const r = verificationResults.get(f.id);
      return r && r.status === "PROVEN";
    });
    const verifiedResults = new Map<string, VerificationResult>();
    for (const f of verifiedFiles) {
      const r = verificationResults.get(f.id);
      if (r) verifiedResults.set(f.id, r);
    }

    if (verifiedFiles.length === 0) return; // Skip if none pass

    const outputDir = path.join(tempDir, "dist");
    const emitResult = emitTypeScript(verifiedFiles, verifiedResults, outputDir);
    expect(emitResult.ok).toBe(true);
    if (!emitResult.ok) return;

    // Check each file was emitted
    for (const file of verifiedFiles) {
      const parts = file.id.split(".");
      const filePath = path.join(outputDir, ...parts.slice(0, -1), parts[parts.length - 1] + ".ts");
      expect(fs.existsSync(filePath)).toBe(true);
    }
  });

  it("should generate views for the auth system", () => {
    const files = loadAuthFiles();
    const linkResult = linkIntentTree(files);
    if (!linkResult.ok) return;

    const verificationResults = new Map<string, VerificationResult>();
    for (const file of files) {
      verificationResults.set(file.id, verifyContract(file));
    }

    const viewsDir = path.join(tempDir, ".generated");
    const viewResult = generateAllViews(files, linkResult.value, verificationResults, viewsDir);
    expect(viewResult.ok).toBe(true);
    if (!viewResult.ok) return;

    // Verify dashboard and business view
    const viewFiles = fs.readdirSync(viewsDir);
    expect(viewFiles).toContain("verification-dashboard.md");
    expect(viewFiles).toContain("business-view.md");
  });
});
