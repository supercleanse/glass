import * as path from "path";
import { parseGlassFile, parseGlassContent } from "../../src/compiler/parser";

const FIXTURES_DIR = path.join(__dirname, "../fixtures/valid-glass-files");

describe("Glass Parser", () => {
  describe("parseGlassFile", () => {
    it("should parse the auth.authenticate_user example from PRD Section 4.1", () => {
      const filePath = path.join(FIXTURES_DIR, "auth.authenticate_user.glass");
      const result = parseGlassFile(filePath);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const file = result.value;

      // Glass Unit header
      expect(file.id).toBe("auth.authenticate_user");
      expect(file.version).toBe("0.1.0");
      expect(file.language).toBe("typescript");

      // Intent
      expect(file.intent.purpose).toBe("Allow registered users to securely log into the system");
      expect(file.intent.source).toEqual({ kind: "conversation", sessionId: "session-1" });
      expect(file.intent.parent).toBeNull();
      expect(file.intent.stakeholder).toBe("user");
      expect(file.intent.subIntents).toHaveLength(2);
      expect(file.intent.subIntents[0]).toEqual({ id: "auth.validate_credentials" });
      expect(file.intent.subIntents[1]).toEqual({
        id: "auth.sanitize_input",
        annotations: ["ai-generated", "security"],
      });

      // Contract requires
      expect(file.contract.requires).toHaveLength(4);
      expect(file.contract.requires[0].description).toBe("input.email is String");

      // Contract guarantees
      expect(file.contract.guarantees.onSuccess.length).toBeGreaterThanOrEqual(3);
      expect(file.contract.guarantees.onFailure.length).toBeGreaterThanOrEqual(3);

      // Contract invariants
      expect(file.contract.invariants).toHaveLength(3);
      expect(file.contract.invariants[0].description).toContain("password_hash never exposed");

      // Contract failure modes
      expect(file.contract.fails).toHaveLength(4);
      expect(file.contract.fails[0]).toEqual({
        errorType: "DatabaseUnavailable",
        handling: "retry(3) then Error(ServiceUnavailable)",
      });

      // Contract advisories
      expect(file.contract.advisories).toHaveLength(1);
      expect(file.contract.advisories[0].description).toContain("fail-open policy");

      // Implementation
      expect(file.implementation).toContain("authenticateUser");
      expect(file.implementation).toContain("DatabaseUnavailable");
    });

    it("should return FileNotFound for non-existent file", () => {
      const result = parseGlassFile("/nonexistent/file.glass");
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.reason).toBe("FileNotFound");
    });
  });

  describe("parseGlassContent", () => {
    it("should return MissingSection for content missing a section", () => {
      const content = `=== Glass Unit ===
id: test.unit
version: 0.1.0
language: typescript

=== Intent ===
purpose: Test unit

=== Implementation ===
// code here`;

      const result = parseGlassContent(content, "test.glass");
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.reason).toBe("MissingSection");
      expect(result.error.section).toBe("Contract");
    });

    it("should parse a minimal valid .glass file", () => {
      const content = `=== Glass Unit ===
id: test.minimal
version: 0.1.0
language: typescript

=== Intent ===
purpose: A minimal test unit
source: prd
parent: null
stakeholder: engineering

=== Contract ===
requires:
  - input is valid

guarantees:
  on_success:
    - result is valid

invariants:
  - no side effects

fails:
  InputError: return error

=== Implementation ===
export function minimal() { return true; }`;

      const result = parseGlassContent(content, "test.glass");
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.id).toBe("test.minimal");
      expect(result.value.contract.requires).toHaveLength(1);
      expect(result.value.contract.guarantees.onSuccess).toHaveLength(1);
      expect(result.value.contract.invariants).toHaveLength(1);
      expect(result.value.contract.fails).toHaveLength(1);
    });

    it("should handle missing intent purpose with error", () => {
      const content = `=== Glass Unit ===
id: test.no_purpose
version: 0.1.0
language: typescript

=== Intent ===
source: prd
parent: null

=== Contract ===
requires:
  - something

=== Implementation ===
// code`;

      const result = parseGlassContent(content, "test.glass");
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.reason).toBe("InvalidSectionContent");
      expect(result.error.section).toBe("Intent");
    });

    it("should parse parent: null as actual null", () => {
      const content = `=== Glass Unit ===
id: test.null_parent
version: 0.1.0
language: typescript

=== Intent ===
purpose: Test null parent
parent: null

=== Contract ===
requires:
  - something

=== Implementation ===
// code`;

      const result = parseGlassContent(content, "test.glass");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.intent.parent).toBeNull();
    });

    it("should handle empty implementation section", () => {
      const content = `=== Glass Unit ===
id: test.empty_impl
version: 0.1.0
language: typescript

=== Intent ===
purpose: Test empty implementation

=== Contract ===
requires:
  - something

=== Implementation ===`;

      const result = parseGlassContent(content, "test.glass");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.implementation).toBe("");
    });
  });
});
