/**
 * Tests for CLI utilities — file discovery and project loading.
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { discoverGlassFiles, loadProject } from "../../src/cli/utils";

describe("CLI Utilities", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "glass-cli-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe("discoverGlassFiles", () => {
    it("should find .glass files in a directory", () => {
      fs.mkdirSync(path.join(tempDir, "src"), { recursive: true });
      fs.writeFileSync(path.join(tempDir, "src", "test.glass"), "content");
      fs.writeFileSync(path.join(tempDir, "src", "other.glass"), "content");

      const files = discoverGlassFiles(path.join(tempDir, "src"));
      expect(files).toHaveLength(2);
    });

    it("should find .glass files recursively", () => {
      fs.mkdirSync(path.join(tempDir, "src", "auth"), { recursive: true });
      fs.writeFileSync(path.join(tempDir, "src", "root.glass"), "content");
      fs.writeFileSync(path.join(tempDir, "src", "auth", "login.glass"), "content");

      const files = discoverGlassFiles(path.join(tempDir, "src"));
      expect(files).toHaveLength(2);
    });

    it("should skip node_modules and .generated directories", () => {
      fs.mkdirSync(path.join(tempDir, "node_modules"), { recursive: true });
      fs.mkdirSync(path.join(tempDir, ".generated"), { recursive: true });
      fs.writeFileSync(path.join(tempDir, "test.glass"), "content");
      fs.writeFileSync(path.join(tempDir, "node_modules", "bad.glass"), "content");
      fs.writeFileSync(path.join(tempDir, ".generated", "bad.glass"), "content");

      const files = discoverGlassFiles(tempDir);
      expect(files).toHaveLength(1);
    });

    it("should skip manifest.glass", () => {
      fs.writeFileSync(path.join(tempDir, "manifest.glass"), "content");
      fs.writeFileSync(path.join(tempDir, "test.glass"), "content");

      const files = discoverGlassFiles(tempDir);
      expect(files).toHaveLength(1);
      expect(files[0]).toContain("test.glass");
    });

    it("should return empty array for non-existent directory", () => {
      const files = discoverGlassFiles("/nonexistent");
      expect(files).toHaveLength(0);
    });

    it("should return empty array for empty directory", () => {
      const files = discoverGlassFiles(tempDir);
      expect(files).toHaveLength(0);
    });
  });

  describe("loadProject", () => {
    it("should load a valid project from fixtures", () => {
      const fixturesDir = path.join(__dirname, "..", "fixtures", "valid-glass-files");
      const result = loadProject(fixturesDir);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.glassFiles.length).toBeGreaterThan(0);
      expect(result.value.tree.roots.length).toBeGreaterThan(0);
      expect(result.value.verificationResults.size).toBeGreaterThan(0);
    });

    it("should return error for empty directory", () => {
      const result = loadProject(tempDir);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toContain("No .glass files");
    });

    it("should return error for non-existent directory", () => {
      const result = loadProject("/nonexistent");
      expect(result.ok).toBe(false);
    });
  });
});
