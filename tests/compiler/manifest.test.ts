import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  parseManifest,
  parseManifestContent,
  serializeManifest,
  ManifestManager,
} from "../../src/compiler/manifest";
import type { Manifest } from "../../src/types/index";

const FIXTURES_DIR = path.join(__dirname, "../fixtures");

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "glass-manifest-test-"));
}

function cleanupDir(dir: string) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
}

describe("Manifest Parser", () => {
  describe("parseManifest", () => {
    it("should parse the project manifest.glass", () => {
      const filePath = path.join(__dirname, "../../manifest.glass");
      const result = parseManifest(filePath);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.projectName).toBe("GlassFramework");
      expect(result.value.version).toBe("0.1.0");
      expect(result.value.language).toBe("typescript");
      expect(result.value.created).toBe("2026-02-01");
    });

    it("should return FileNotFound for non-existent file", () => {
      const result = parseManifest("/nonexistent/manifest.glass");
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.reason).toBe("FileNotFound");
    });
  });

  describe("parseManifestContent", () => {
    it("should parse a complete manifest", () => {
      const content = `Glass Manifest: MyProject
Version: 1.0.0
Language: TypeScript
Created: 2026-01-15

Origins:
  PRD: "Product Requirements Document"
    → authored by user, 2026-01-15
  Conversation: "Feature discussion session"
    → authored by team, 2026-01-16

Policies:
  auto-approve: security, audit
  require-approval: business-logic, data-model

Intent Registry:
  user-originated: 5 intents
  conversation-derived: 3 intents
  ai-generated: 12 intents
`;

      const result = parseManifestContent(content);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const manifest = result.value;
      expect(manifest.projectName).toBe("MyProject");
      expect(manifest.version).toBe("1.0.0");
      expect(manifest.language).toBe("typescript");
      expect(manifest.created).toBe("2026-01-15");

      // Origins
      expect(manifest.origins).toHaveLength(2);
      expect(manifest.origins[0].kind).toBe("prd");
      expect(manifest.origins[0].description).toBe("Product Requirements Document");
      expect(manifest.origins[0].author).toBe("user");
      expect(manifest.origins[1].kind).toBe("conversation");

      // Policies
      expect(manifest.policies.autoApprove).toEqual(["security", "audit"]);
      expect(manifest.policies.requireApproval).toEqual(["business-logic", "data-model"]);

      // Intent Registry
      expect(manifest.intentRegistry.userOriginated).toBe(5);
      expect(manifest.intentRegistry.conversationDerived).toBe(3);
      expect(manifest.intentRegistry.aiGenerated).toBe(12);
    });

    it("should handle missing header", () => {
      const content = `Version: 1.0.0
Language: TypeScript`;

      const result = parseManifestContent(content);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.reason).toBe("MissingField");
    });

    it("should handle minimal manifest", () => {
      const content = `Glass Manifest: Minimal
Version: 0.1.0

Origins:

Policies:

Intent Registry:
`;

      const result = parseManifestContent(content);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.projectName).toBe("Minimal");
      expect(result.value.origins).toHaveLength(0);
      expect(result.value.policies.autoApprove).toHaveLength(0);
      expect(result.value.intentRegistry.userOriginated).toBe(0);
    });
  });

  describe("serializeManifest", () => {
    it("should serialize and re-parse to same data", () => {
      const manifest: Manifest = {
        projectName: "TestProject",
        version: "2.0.0",
        language: "typescript",
        created: "2026-03-01",
        origins: [
          { kind: "prd", name: "PRD", description: "Test PRD", author: "tester", date: "2026-03-01" },
        ],
        policies: {
          autoApprove: ["security"],
          requireApproval: ["business-logic"],
        },
        intentRegistry: {
          userOriginated: 3,
          conversationDerived: 2,
          aiGenerated: 7,
        },
      };

      const serialized = serializeManifest(manifest);
      const reparsed = parseManifestContent(serialized);

      expect(reparsed.ok).toBe(true);
      if (!reparsed.ok) return;

      expect(reparsed.value.projectName).toBe("TestProject");
      expect(reparsed.value.version).toBe("2.0.0");
      expect(reparsed.value.intentRegistry.userOriginated).toBe(3);
      expect(reparsed.value.intentRegistry.conversationDerived).toBe(2);
      expect(reparsed.value.intentRegistry.aiGenerated).toBe(7);
    });
  });

  describe("ManifestManager", () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = makeTempDir();
    });

    afterEach(() => {
      cleanupDir(tempDir);
    });

    it("should load from file", () => {
      const filePath = path.join(tempDir, "manifest.glass");
      fs.writeFileSync(filePath, `Glass Manifest: LoadTest
Version: 0.1.0
Language: TypeScript
Created: 2026-01-01

Origins:

Policies:
  auto-approve: security

Intent Registry:
  user-originated: 0 intents
  conversation-derived: 0 intents
  ai-generated: 0 intents
`);

      const result = ManifestManager.load(filePath);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const mgr = result.value;
      expect(mgr.getManifest().projectName).toBe("LoadTest");
    });

    it("should add origins", () => {
      const filePath = path.join(tempDir, "manifest.glass");
      fs.writeFileSync(filePath, `Glass Manifest: OriginTest
Version: 0.1.0

Origins:

Policies:

Intent Registry:
`);

      const result = ManifestManager.load(filePath);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const mgr = result.value;
      mgr.addOrigin({
        kind: "conversation",
        name: "Conversation",
        description: "Feature request",
        author: "user",
        date: "2026-02-01",
      });

      expect(mgr.getManifest().origins).toHaveLength(1);
      expect(mgr.getManifest().origins[0].kind).toBe("conversation");
    });

    it("should update intent registry", () => {
      const filePath = path.join(tempDir, "manifest.glass");
      fs.writeFileSync(filePath, `Glass Manifest: RegistryTest
Version: 0.1.0

Origins:

Policies:

Intent Registry:
  user-originated: 0 intents
  conversation-derived: 0 intents
  ai-generated: 0 intents
`);

      const result = ManifestManager.load(filePath);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const mgr = result.value;
      mgr.updateIntentRegistry({ userOriginated: 5, aiGenerated: 10 });

      expect(mgr.getManifest().intentRegistry.userOriginated).toBe(5);
      expect(mgr.getManifest().intentRegistry.conversationDerived).toBe(0);
      expect(mgr.getManifest().intentRegistry.aiGenerated).toBe(10);
    });

    it("should check approval policies", () => {
      const filePath = path.join(tempDir, "manifest.glass");
      fs.writeFileSync(filePath, `Glass Manifest: PolicyTest
Version: 0.1.0

Origins:

Policies:
  auto-approve: security, audit
  require-approval: business-logic

Intent Registry:
`);

      const result = ManifestManager.load(filePath);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const mgr = result.value;
      expect(mgr.getApprovalPolicy("security")).toBe("auto-approve");
      expect(mgr.getApprovalPolicy("audit")).toBe("auto-approve");
      expect(mgr.getApprovalPolicy("business-logic")).toBe("require-approval");
      expect(mgr.getApprovalPolicy("unknown-category")).toBe("unknown");
    });

    it("should save and reload", () => {
      const filePath = path.join(tempDir, "manifest.glass");
      fs.writeFileSync(filePath, `Glass Manifest: SaveTest
Version: 0.1.0

Origins:

Policies:

Intent Registry:
  user-originated: 0 intents
  conversation-derived: 0 intents
  ai-generated: 0 intents
`);

      const result = ManifestManager.load(filePath);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const mgr = result.value;
      mgr.updateIntentRegistry({ aiGenerated: 42 });
      mgr.addOrigin({
        kind: "prd",
        name: "PRD",
        description: "Added after save",
        author: "test",
        date: "2026-02-01",
      });

      const saveResult = mgr.save();
      expect(saveResult.ok).toBe(true);

      // Reload and verify
      const reloaded = ManifestManager.load(filePath);
      expect(reloaded.ok).toBe(true);
      if (!reloaded.ok) return;

      expect(reloaded.value.getManifest().intentRegistry.aiGenerated).toBe(42);
      expect(reloaded.value.getManifest().origins).toHaveLength(1);
    });
  });
});
