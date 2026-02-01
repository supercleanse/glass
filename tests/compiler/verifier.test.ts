import {
  verifyContract,
  verifyAll,
  generateInstrumentation,
  summarizeInstrumentation,
} from "../../src/compiler/verifier";
import type { GlassFile } from "../../src/types/index";

/** Helper to build a minimal GlassFile for testing. */
function makeFile(overrides: Partial<GlassFile> & { id: string }): GlassFile {
  return {
    version: "0.1.0",
    language: "typescript",
    intent: {
      purpose: "Test unit " + overrides.id,
      source: { kind: "prd", reference: "test" },
      parent: null,
      stakeholder: "engineering",
      subIntents: [],
      approvalStatus: "approved",
    },
    contract: {
      requires: [],
      guarantees: { onSuccess: [], onFailure: [] },
      invariants: [],
      fails: [],
      advisories: [],
    },
    implementation: "// stub",
    ...overrides,
  };
}

describe("Contract Verifier", () => {
  describe("verifyContract", () => {
    it("should verify the auth example from PRD Section 4.1", () => {
      const file = makeFile({
        id: "auth.authenticate_user",
        contract: {
          requires: [
            { description: "input.email is String" },
            { description: "input.password is String" },
            { description: "system.database is Active" },
            { description: "system.session_store is Active" },
          ],
          guarantees: {
            onSuccess: [
              { description: "result is AuthSuccess" },
              { description: "result.session is ValidSession" },
              { description: "result.session.userId == verified_user.id" },
              { description: "audit_log appended with AuthAttempt(success: true)" },
            ],
            onFailure: [
              { description: "result is AuthFailure" },
              { description: "result.reason in [InvalidCredentials, AccountLocked, RateLimited, ServiceUnavailable]" },
              { description: "no session created" },
              { description: "audit_log appended with AuthAttempt(success: false)" },
            ],
          },
          invariants: [
            { description: "user.password_hash never exposed in output or logs" },
            { description: "user.password_hash never held in memory after comparison" },
            { description: "rate_limit.state correctly updated" },
          ],
          fails: [
            { errorType: "DatabaseUnavailable", handling: "retry(3) then Error(ServiceUnavailable)" },
            { errorType: "SessionStoreUnavailable", handling: "retry(3) then Error(ServiceUnavailable)" },
            { errorType: "RateLimitExceeded", handling: "Error(RateLimited, lockout: remaining_seconds)" },
            { errorType: "UnexpectedError", handling: "Error(ServiceUnavailable), alert(ops-team)" },
          ],
          advisories: [
            { description: "rate_limit_login uses fail-open policy (see unit for details)", resolved: false },
          ],
        },
        implementation: `export async function authenticateUser(input: { email: string; password: string }) {
  try {
    const user = await findUser(input.email);
    if (!user) throw new Error("InvalidCredentials");
    const valid = await comparePassword(input.password, user.passwordHash);
    if (!valid) throw new Error("InvalidCredentials");
    const session = await createSession(user.id);
    await logAuthAttempt(user.id, true);
    return { success: true, session };
  } catch (error) {
    if (error instanceof DatabaseUnavailable) {
      throw new Error("ServiceUnavailable");
    }
    if (error instanceof SessionStoreUnavailable) {
      throw new Error("ServiceUnavailable");
    }
    if (error instanceof RateLimitExceeded) {
      throw new Error("RateLimited");
    }
    throw new Error("UnexpectedError");
  }
}`,
      });

      const result = verifyContract(file);

      // Should pass overall — all assertions should pass
      expect(result.status).toBe("PROVEN");
      expect(result.unitId).toBe("auth.authenticate_user");

      // All assertions should pass
      for (const assertion of result.assertions) {
        expect(assertion.passed).toBe(true);
      }

      // Should have assertions for requires, guarantees, invariants, and failure modes
      expect(result.assertions.length).toBeGreaterThanOrEqual(15);

      // Advisories should include contract advisories plus instrumented assertion advisories
      expect(result.advisories.length).toBeGreaterThanOrEqual(1);
      expect(result.advisories.some((a) => a.description.includes("fail-open policy"))).toBe(true);
    });

    it("should detect input parameters as PROVEN when referenced", () => {
      const file = makeFile({
        id: "test.inputs",
        contract: {
          requires: [
            { description: "input.name is String" },
          ],
          guarantees: { onSuccess: [], onFailure: [] },
          invariants: [],
          fails: [],
          advisories: [],
        },
        implementation: `function greet(input: { name: string }) { return "Hello " + input.name; }`,
      });

      const result = verifyContract(file);
      expect(result.status).toBe("PROVEN");

      const inputAssertion = result.assertions.find((a) => a.assertion.includes("input.name"));
      expect(inputAssertion).toBeDefined();
      expect(inputAssertion!.level).toBe("PROVEN");
    });

    it("should mark system preconditions as INSTRUMENTED", () => {
      const file = makeFile({
        id: "test.system",
        contract: {
          requires: [
            { description: "system.database is Active" },
          ],
          guarantees: { onSuccess: [], onFailure: [] },
          invariants: [],
          fails: [],
          advisories: [],
        },
        implementation: `function query() { return db.query(); }`,
      });

      const result = verifyContract(file);
      const systemAssertion = result.assertions.find((a) => a.assertion.includes("system.database"));
      expect(systemAssertion).toBeDefined();
      expect(systemAssertion!.level).toBe("INSTRUMENTED");
    });

    it("should fail when input parameter is not referenced", () => {
      const file = makeFile({
        id: "test.unused",
        contract: {
          requires: [
            { description: "input.token is String" },
          ],
          guarantees: { onSuccess: [], onFailure: [] },
          invariants: [],
          fails: [],
          advisories: [],
        },
        implementation: `function doNothing() { return true; }`,
      });

      const result = verifyContract(file);
      expect(result.status).toBe("FAILED");

      const tokenAssertion = result.assertions.find((a) => a.assertion.includes("input.token"));
      expect(tokenAssertion).toBeDefined();
      expect(tokenAssertion!.passed).toBe(false);
    });

    it("should verify failure mode handlers as PROVEN when catch exists", () => {
      const file = makeFile({
        id: "test.failures",
        contract: {
          requires: [],
          guarantees: { onSuccess: [], onFailure: [] },
          invariants: [],
          fails: [
            { errorType: "NetworkError", handling: "Error(ServiceUnavailable)" },
          ],
          advisories: [],
        },
        implementation: `try { fetch(); } catch (e) { if (e instanceof NetworkError) throw new Error("ServiceUnavailable"); }`,
      });

      const result = verifyContract(file);
      const failureAssertion = result.assertions.find((a) => a.assertion.includes("NetworkError"));
      expect(failureAssertion).toBeDefined();
      expect(failureAssertion!.passed).toBe(true);
      expect(failureAssertion!.level).toBe("PROVEN");
    });

    it("should fail when failure mode has no handler", () => {
      const file = makeFile({
        id: "test.missing_handler",
        contract: {
          requires: [],
          guarantees: { onSuccess: [], onFailure: [] },
          invariants: [],
          fails: [
            { errorType: "TimeoutError", handling: "Error(Timeout)" },
          ],
          advisories: [],
        },
        implementation: `function simple() { return true; }`,
      });

      const result = verifyContract(file);
      expect(result.status).toBe("FAILED");

      const failureAssertion = result.assertions.find((a) => a.assertion.includes("TimeoutError"));
      expect(failureAssertion).toBeDefined();
      expect(failureAssertion!.passed).toBe(false);
    });

    it("should detect sensitive data exposure in logs", () => {
      const file = makeFile({
        id: "test.exposure",
        contract: {
          requires: [],
          guarantees: { onSuccess: [], onFailure: [] },
          invariants: [
            { description: "user.password_hash never exposed in output or logs" },
          ],
          fails: [],
          advisories: [],
        },
        implementation: `function bad(user: any) { console.log(user.password_hash); }`,
      });

      const result = verifyContract(file);
      expect(result.status).toBe("FAILED");

      const invariantAssertion = result.assertions.find((a) =>
        a.assertion.includes("password_hash never exposed"),
      );
      expect(invariantAssertion).toBeDefined();
      expect(invariantAssertion!.passed).toBe(false);
    });

    it("should pass when sensitive data is used safely", () => {
      const file = makeFile({
        id: "test.safe",
        contract: {
          requires: [],
          guarantees: { onSuccess: [], onFailure: [] },
          invariants: [
            { description: "user.password_hash never exposed in output or logs" },
          ],
          fails: [],
          advisories: [],
        },
        implementation: `function verify(input: string, hash: string) { const valid = bcrypt.compare(input, password_hash); }`,
      });

      const result = verifyContract(file);
      const invariantAssertion = result.assertions.find((a) =>
        a.assertion.includes("password_hash never exposed"),
      );
      expect(invariantAssertion).toBeDefined();
      expect(invariantAssertion!.passed).toBe(true);
      expect(invariantAssertion!.level).toBe("PROVEN");
    });

    it("should mark memory invariants as INSTRUMENTED", () => {
      const file = makeFile({
        id: "test.memory",
        contract: {
          requires: [],
          guarantees: { onSuccess: [], onFailure: [] },
          invariants: [
            { description: "user.password_hash never held in memory after comparison" },
          ],
          fails: [],
          advisories: [],
        },
        implementation: `function verify() { return true; }`,
      });

      const result = verifyContract(file);
      const memAssertion = result.assertions.find((a) =>
        a.assertion.includes("never held in memory"),
      );
      expect(memAssertion).toBeDefined();
      expect(memAssertion!.level).toBe("INSTRUMENTED");
    });

    it("should pass through contract advisories", () => {
      const file = makeFile({
        id: "test.advisories",
        contract: {
          requires: [],
          guarantees: { onSuccess: [], onFailure: [] },
          invariants: [],
          fails: [],
          advisories: [
            { description: "Rate limiting uses fail-open policy", resolved: false },
          ],
        },
        implementation: `function stub() {}`,
      });

      const result = verifyContract(file);
      expect(result.advisories.some((a) => a.description.includes("fail-open policy"))).toBe(true);
    });

    it("should be deterministic — same input produces same output", () => {
      const file = makeFile({
        id: "test.determinism",
        contract: {
          requires: [{ description: "input.x is Number" }],
          guarantees: { onSuccess: [{ description: "result is Valid" }], onFailure: [] },
          invariants: [{ description: "state correctly updated" }],
          fails: [{ errorType: "ValueError", handling: "Error(Invalid)" }],
          advisories: [],
        },
        implementation: `function process(input: { x: number }) { try { return input.x * 2; } catch (e) { if (e instanceof ValueError) throw new Error("Invalid"); } }`,
      });

      const result1 = verifyContract(file);
      const result2 = verifyContract(file);

      expect(result1.status).toBe(result2.status);
      expect(result1.assertions.length).toBe(result2.assertions.length);
      for (let i = 0; i < result1.assertions.length; i++) {
        expect(result1.assertions[i].assertion).toBe(result2.assertions[i].assertion);
        expect(result1.assertions[i].passed).toBe(result2.assertions[i].passed);
        expect(result1.assertions[i].level).toBe(result2.assertions[i].level);
      }
    });

    it("should not modify the input GlassFile", () => {
      const file = makeFile({
        id: "test.immutable",
        contract: {
          requires: [{ description: "input.x is String" }],
          guarantees: { onSuccess: [], onFailure: [] },
          invariants: [],
          fails: [],
          advisories: [{ description: "test advisory", resolved: false }],
        },
        implementation: `function f(input: { x: string }) { return input.x; }`,
      });

      const original = JSON.parse(JSON.stringify(file));
      verifyContract(file);
      expect(JSON.stringify(file)).toBe(JSON.stringify(original));
    });
  });

  describe("verifyAll", () => {
    it("should verify multiple files", () => {
      const files = [
        makeFile({ id: "a", implementation: `function a() { return true; }` }),
        makeFile({ id: "b", implementation: `function b() { return false; }` }),
      ];

      const results = verifyAll(files);
      expect(results.size).toBe(2);
      expect(results.has("a")).toBe(true);
      expect(results.has("b")).toBe(true);
    });
  });

  describe("generateInstrumentation", () => {
    it("should generate runtime checks for INSTRUMENTED assertions", () => {
      const file = makeFile({
        id: "test.instrument",
        contract: {
          requires: [
            { description: "system.database is Active" },
          ],
          guarantees: {
            onSuccess: [{ description: "result is Valid" }],
            onFailure: [],
          },
          invariants: [
            { description: "state correctly updated" },
          ],
          fails: [],
          advisories: [],
        },
        implementation: `function process() { return true; }`,
      });

      const result = verifyContract(file);
      const plan = generateInstrumentation(file, result);

      expect(plan.unitId).toBe("test.instrument");
      expect(plan.checks.length).toBeGreaterThan(0);

      // All checks should be INSTRUMENTED
      for (const check of plan.checks) {
        expect(check.verificationLevel).toBe("INSTRUMENTED");
      }
    });

    it("should not generate checks for PROVEN assertions", () => {
      const file = makeFile({
        id: "test.proven",
        contract: {
          requires: [
            { description: "input.name is String" },
          ],
          guarantees: { onSuccess: [], onFailure: [] },
          invariants: [],
          fails: [],
          advisories: [],
        },
        implementation: `function greet(input: { name: string }) { return input.name; }`,
      });

      const result = verifyContract(file);
      const plan = generateInstrumentation(file, result);

      // The input.name assertion should be PROVEN, so no instrumentation
      const preChecks = plan.checks.filter((c) => c.insertionPoint === "pre");
      expect(preChecks).toHaveLength(0);
    });

    it("should generate precondition checks for system requirements", () => {
      const file = makeFile({
        id: "test.pre",
        contract: {
          requires: [
            { description: "system.db is Active" },
          ],
          guarantees: { onSuccess: [], onFailure: [] },
          invariants: [],
          fails: [],
          advisories: [],
        },
        implementation: `function query() { return db.find(); }`,
      });

      const result = verifyContract(file);
      const plan = generateInstrumentation(file, result);

      const preChecks = plan.checks.filter((c) => c.insertionPoint === "pre");
      expect(preChecks.length).toBeGreaterThanOrEqual(1);
      expect(preChecks[0].checkCode).toContain("system");
    });

    it("should not modify the input GlassFile", () => {
      const file = makeFile({
        id: "test.immutable2",
        contract: {
          requires: [{ description: "system.x is Active" }],
          guarantees: { onSuccess: [], onFailure: [] },
          invariants: [],
          fails: [],
          advisories: [],
        },
        implementation: `function f() {}`,
      });

      const original = JSON.parse(JSON.stringify(file));
      const result = verifyContract(file);
      generateInstrumentation(file, result);
      expect(JSON.stringify(file)).toBe(JSON.stringify(original));
    });
  });

  describe("summarizeInstrumentation", () => {
    it("should summarize non-empty plan", () => {
      const plan = {
        unitId: "test.summary",
        checks: [
          {
            assertionText: "system.db is Active",
            verificationLevel: "INSTRUMENTED" as const,
            checkCode: "// check",
            insertionPoint: "pre" as const,
            errorMessage: "Precondition failed",
          },
        ],
      };

      const summary = summarizeInstrumentation(plan);
      expect(summary).toContain("test.summary");
      expect(summary).toContain("1 runtime check(s)");
      expect(summary).toContain("[PRE]");
      expect(summary).toContain("system.db is Active");
    });

    it("should summarize empty plan", () => {
      const plan = { unitId: "test.empty", checks: [] };
      const summary = summarizeInstrumentation(plan);
      expect(summary).toContain("No runtime instrumentation needed");
      expect(summary).toContain("test.empty");
    });
  });
});
