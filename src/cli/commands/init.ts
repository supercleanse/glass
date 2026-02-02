/**
 * glass init — initialize a new Glass project.
 * @fails DirectoryExists
 */

import { Command } from "commander";
import chalk from "chalk";
import * as fs from "fs";
import * as path from "path";

export const initCommand = new Command("init")
  .description("Initialize a new Glass project (defaults to current directory)")
  .argument("[name]", "Project name / directory (defaults to current directory)")
  .option("-l, --language <lang>", "Target language (typescript | rust)", "typescript")
  .option("--no-git", "Skip git initialization")
  .action(async (nameArg: string | undefined, opts) => {
    const inPlace = !nameArg;
    const targetDir = inPlace ? process.cwd() : path.resolve(nameArg);
    const name = inPlace ? path.basename(targetDir) : path.basename(nameArg);

    if (!inPlace && fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
      console.error(chalk.red("Error:") + " Directory '" + name + "' already exists and is not empty");
      process.exitCode = 1;
      return;
    }

    if (inPlace && fs.existsSync(path.join(targetDir, "glass.config.json"))) {
      console.error(chalk.red("Error:") + " glass.config.json already exists — project already initialized");
      process.exitCode = 1;
      return;
    }

    console.log(chalk.blue("Glass") + " Initializing project: " + name);

    // Create directory structure (PRD Section 16)
    const dirs = [
      "",
      "glass",
      "src",
      "dist",
      "glass-views",
      "glass-views/units",
      "annotations",
      "tests",
    ];

    for (const dir of dirs) {
      fs.mkdirSync(path.join(targetDir, dir), { recursive: true });
    }

    // Generate manifest.glass
    const date = new Date().toISOString().split("T")[0];
    const manifestContent = `Glass Manifest: ${name}
Version: 0.1.0
Language: ${opts.language === "rust" ? "Rust" : "TypeScript"}
Created: ${date}

Origins:

Policies:
  auto-approve: security, audit, infrastructure
  require-approval: business-logic, data-model

Intent Registry:
  user-originated: 0 intents
  conversation-derived: 0 intents
  ai-generated: 0 intents
`;
    fs.writeFileSync(path.join(targetDir, "manifest.glass"), manifestContent, "utf-8");

    // Generate glass.config.json
    const config = {
      version: "0.1.0",
      language: opts.language,
      projectName: name,
      outputDir: "dist",
      generatedDir: "glass-views",
      annotationsDir: "annotations",
      glassDir: "glass",
      sourceDir: "src",
    };
    fs.writeFileSync(
      path.join(targetDir, "glass.config.json"),
      JSON.stringify(config, null, 2) + "\n",
      "utf-8",
    );

    // Generate .gitignore
    fs.writeFileSync(
      path.join(targetDir, ".gitignore"),
      "node_modules/\ndist/\n*.log\n.DS_Store\n",
      "utf-8",
    );

    // Generate GLASS.md — the full Glass methodology reference
    fs.writeFileSync(
      path.join(targetDir, "GLASS.md"),
      generateGlassMd(name, opts.language),
      "utf-8",
    );

    // Generate AI assistant seed files that point to GLASS.md
    const seedLine = "Read [GLASS.md](./GLASS.md) for the Glass Framework methodology, file format, and conventions used in this project.\n";

    // CLAUDE.md (Claude Code / Anthropic)
    if (!fs.existsSync(path.join(targetDir, "CLAUDE.md"))) {
      fs.writeFileSync(path.join(targetDir, "CLAUDE.md"), seedLine, "utf-8");
    }

    // AGENTS.md (GitHub Copilot / OpenAI Codex)
    if (!fs.existsSync(path.join(targetDir, "AGENTS.md"))) {
      fs.writeFileSync(path.join(targetDir, "AGENTS.md"), seedLine, "utf-8");
    }

    // .cursorrules (Cursor)
    if (!fs.existsSync(path.join(targetDir, ".cursorrules"))) {
      fs.writeFileSync(path.join(targetDir, ".cursorrules"), seedLine, "utf-8");
    }

    console.log(chalk.green("  +") + " Created manifest.glass");
    console.log(chalk.green("  +") + " Created glass.config.json");
    console.log(chalk.green("  +") + " Created GLASS.md");
    console.log(chalk.green("  +") + " Created AI context files (CLAUDE.md, AGENTS.md, .cursorrules)");
    console.log(chalk.green("  +") + " Created directory structure");
    console.log("");
    console.log(chalk.green("Project initialized!") + " Next steps:");
    if (!inPlace) {
      console.log("  cd " + name);
    }
    console.log("  # Add .glass spec files to glass/");
    console.log("  glass verify");
    console.log("  glass compile");
  });

function generateGlassMd(projectName: string, language: string): string {
  const lang = language === "rust" ? "Rust" : "TypeScript";
  const ext = language === "rust" ? ".rs" : ".ts";
  return `# Glass Framework — ${projectName}

This project uses the **Glass Framework**. Glass is a higher-level language that sits above ${lang}. You write specs in \`.glass\` files, and the compiler verifies that the ${lang} implementation satisfies the spec.

**Humans read \`.glass\` files. They should never need to read \`.${ext.slice(1)}\` files directly.**

## How Glass Works

Glass has three layers for every unit of functionality:

1. **Intent** — WHY does this code exist? (plain English, traced to a source)
2. **Contract** — WHAT does this code guarantee? (preconditions, postconditions, invariants, failure modes)
3. **Implementation** — HOW does it work? (${lang} code in a paired \`${ext}\` file)

The \`.glass\` spec file contains Intent + Contract. The implementation lives in a separate \`${ext}\` file. The Glass compiler verifies the implementation satisfies the contract.

## Project Structure

\`\`\`
${projectName}/
  glass/              # .glass spec files (intent + contract) — EDIT THESE
  src/                # ${lang} implementation files — AI generates these
  dist/               # Compiled output
  glass-views/        # Auto-generated human-readable views
  annotations/        # Human annotations on outlines
  tests/              # Test suite
  manifest.glass      # Living requirements document
  glass.config.json   # Project configuration
\`\`\`

## .glass File Format

Every \`.glass\` file in \`glass/\` is a spec with two sections:

\`\`\`
=== Glass Unit ===
id: module.unit_name
version: 0.1.0
language: ${language}

=== Intent ===
purpose: Plain English description of why this exists
source:
  kind: prd
  reference: "where this requirement came from"
parent: null
stakeholder: user
subIntents: []
approvalStatus: approved

=== Contract ===
requires:
  - "precondition that must be true before execution"
guarantees:
  on_success:
    - "postcondition guaranteed after successful execution"
  on_failure:
    - "postcondition guaranteed when execution fails"
invariants:
  - "property that must hold throughout execution"
fails:
  ErrorType: "handling strategy"
advisories:
  - "decision flagged for human review"
\`\`\`

The paired implementation file lives at the same relative path in \`src/\`:
- \`glass/auth/login.glass\` pairs with \`src/auth/login${ext}\`

## Creating a New Unit

1. Create the spec: \`glass/module/name.glass\`
2. Create the implementation: \`src/module/name${ext}\`
3. Verify: \`glass verify\`
4. Compile: \`glass compile\`

## Contract Rules

Every contract must have:
- **requires** — preconditions (refuse to run if not met)
- **guarantees** — postconditions split into on_success and on_failure
- **invariants** — properties that hold throughout execution
- **fails** — every failure mode with explicit handling
- **advisories** — (optional) decisions flagged for human review

## Intent Rules

Every intent must have:
- **purpose** — plain English statement of what and why
- **source** — where this requirement came from (\`prd\`, \`conversation\`, or \`ai-generated\`)
- **parent** — parent intent ID (or \`null\` for top-level)
- **stakeholder** — who cares (\`user\`, \`product\`, \`engineering\`, \`security\`)

## CLI Commands

\`\`\`bash
glass verify              # Verify all contracts are satisfied
glass compile             # Full pipeline: parse, link, verify, emit
glass status              # Show verification dashboard
glass tree                # Display intent hierarchy
glass trace <unit-id>     # Show provenance chain for a unit
glass views               # Generate human-readable outlines
\`\`\`

## Rules for AI Assistants

### Always
- Create a \`.glass\` spec file before writing implementation code
- Every unit needs both an Intent (why) and Contract (what it guarantees)
- Handle every failure mode explicitly in the contract
- Use \`Result<T, E>\` pattern for error handling (no thrown exceptions in library code)
- Run \`glass verify\` after making changes to confirm contracts are satisfied

### Never
- Create implementation without a paired \`.glass\` spec
- Leave failure modes unhandled in the contract
- Modify \`.glass\` files during compilation
- Expose sensitive data in outputs or logs
- Skip the verification step

## Coding Standards

- Strict mode always enabled
- Use descriptive names, no abbreviations
- Keep functions focused on a single responsibility
- Glass unit IDs use dotted notation: \`module.unit_name\`
- File names use kebab-case: \`my-module.glass\` / \`my-module${ext}\`
`;
}
