/**
 * Tests for the Annotation System (PRD Section 8.4).
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  addAnnotation,
  loadAnnotations,
  loadAllAnnotations,
  resolveAnnotation,
  deleteAnnotation,
  getUnresolvedAnnotations,
  isValidTarget,
} from "../../src/compiler/annotations";

describe("Annotation System", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "glass-annotations-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe("isValidTarget", () => {
    it("should accept line:<n> targets", () => {
      expect(isValidTarget("line:15")).toBe(true);
      expect(isValidTarget("line:1")).toBe(true);
      expect(isValidTarget("line:9999")).toBe(true);
    });

    it("should accept dotted path targets", () => {
      expect(isValidTarget("contract.requires.1")).toBe(true);
      expect(isValidTarget("contract.guarantees.success.2")).toBe(true);
      expect(isValidTarget("intent.purpose")).toBe(true);
      expect(isValidTarget("implementation")).toBe(true);
    });

    it("should reject invalid targets", () => {
      expect(isValidTarget("")).toBe(false);
      expect(isValidTarget("line:")).toBe(false);
      expect(isValidTarget("line:abc")).toBe(false);
      expect(isValidTarget("random.stuff")).toBe(false);
      expect(isValidTarget("foo")).toBe(false);
    });
  });

  describe("addAnnotation", () => {
    it("should add an annotation and persist to file", () => {
      const result = addAnnotation(
        tempDir,
        "auth.login",
        "contract.guarantees.success.1",
        "Duration should be 24 hours for regular users",
        "reviewer",
      );

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.unitId).toBe("auth.login");
      expect(result.value.target).toBe("contract.guarantees.success.1");
      expect(result.value.note).toBe("Duration should be 24 hours for regular users");
      expect(result.value.author).toBe("reviewer");
      expect(result.value.resolved).toBe(false);
      expect(result.value.id).toMatch(/^ann-/);

      // Verify persisted
      const loaded = loadAnnotations(tempDir, "auth.login");
      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe(result.value.id);
    });

    it("should support multiple annotations for the same unit", () => {
      addAnnotation(tempDir, "auth.login", "line:10", "First note", "alice");
      addAnnotation(tempDir, "auth.login", "line:20", "Second note", "bob");

      const loaded = loadAnnotations(tempDir, "auth.login");
      expect(loaded).toHaveLength(2);
    });

    it("should reject invalid targets", () => {
      const result = addAnnotation(tempDir, "auth.login", "bad-target", "Note", "author");
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.reason).toBe("InvalidTarget");
    });
  });

  describe("loadAnnotations", () => {
    it("should return empty array for non-existent unit", () => {
      expect(loadAnnotations(tempDir, "nonexistent")).toEqual([]);
    });
  });

  describe("loadAllAnnotations", () => {
    it("should return annotations from all units", () => {
      addAnnotation(tempDir, "auth.login", "line:1", "Note A", "alice");
      addAnnotation(tempDir, "orders.create", "line:5", "Note B", "bob");

      const all = loadAllAnnotations(tempDir);
      expect(all).toHaveLength(2);
    });

    it("should return empty for non-existent directory", () => {
      expect(loadAllAnnotations("/nonexistent")).toEqual([]);
    });
  });

  describe("resolveAnnotation", () => {
    it("should mark an annotation as resolved", () => {
      const added = addAnnotation(tempDir, "auth.login", "line:1", "Fix this", "alice");
      if (!added.ok) return;

      const result = resolveAnnotation(tempDir, "auth.login", added.value.id);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.resolved).toBe(true);

      // Verify persisted
      const loaded = loadAnnotations(tempDir, "auth.login");
      expect(loaded[0].resolved).toBe(true);
    });

    it("should return error for non-existent annotation", () => {
      const result = resolveAnnotation(tempDir, "auth.login", "nonexistent");
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.reason).toBe("AnnotationNotFound");
    });
  });

  describe("deleteAnnotation", () => {
    it("should delete an annotation", () => {
      const added = addAnnotation(tempDir, "auth.login", "line:1", "Delete me", "alice");
      if (!added.ok) return;

      const result = deleteAnnotation(tempDir, "auth.login", added.value.id);
      expect(result.ok).toBe(true);

      const loaded = loadAnnotations(tempDir, "auth.login");
      expect(loaded).toHaveLength(0);
    });

    it("should return error for non-existent annotation", () => {
      const result = deleteAnnotation(tempDir, "auth.login", "nonexistent");
      expect(result.ok).toBe(false);
    });
  });

  describe("getUnresolvedAnnotations", () => {
    it("should return only unresolved annotations", () => {
      const a1 = addAnnotation(tempDir, "auth.login", "line:1", "Open", "alice");
      const a2 = addAnnotation(tempDir, "auth.login", "line:2", "Will resolve", "bob");
      if (!a1.ok || !a2.ok) return;

      resolveAnnotation(tempDir, "auth.login", a2.value.id);

      const unresolved = getUnresolvedAnnotations(tempDir);
      expect(unresolved).toHaveLength(1);
      expect(unresolved[0].note).toBe("Open");
    });
  });
});
