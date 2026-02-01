/**
 * glass trace — display full provenance chain from business goal to implementation.
 */

import { Command } from "commander";
import chalk from "chalk";
import { loadProject } from "../utils";
import type { IntentTree, GlassFile } from "../../types/index";

export const traceCommand = new Command("trace")
  .description("Show full provenance chain for a unit")
  .argument("<unitId>", "Glass unit ID to trace")
  .option("-s, --source <dir>", "Source directory", "src")
  .option("-c, --contracts", "Show contracts at each level", false)
  .action(async (unitId: string, opts) => {
    const project = loadProject(opts.source);
    if (!project.ok) {
      console.error(chalk.red("Error:") + " " + project.error);
      process.exitCode = 1;
      return;
    }

    const { tree, verificationResults } = project.value;

    if (!tree.files.has(unitId)) {
      console.error(chalk.red("Error:") + " Unit not found: " + unitId);
      process.exitCode = 1;
      return;
    }

    // Walk up the parent chain to build ancestry from root to target
    const chain = buildAncestryChain(tree, unitId);

    console.log(chalk.bold("Provenance: " + unitId) + "\n");

    for (let i = 0; i < chain.length; i++) {
      const file = chain[i];
      const isLast = i === chain.length - 1;
      const indent = "  ".repeat(i);

      // Source description
      const sourceDesc = formatSource(file);
      const approvalDesc = formatApproval(file);

      if (i === 0 && file.intent.parent === null) {
        console.log(indent + chalk.cyan("Business Goal:") + " \"" + file.intent.purpose + "\"");
      } else {
        const label = isLast ? "Implementation" : "Intent";
        console.log(indent + chalk.cyan(label + ":") + " \"" + file.intent.purpose + "\"");
      }

      console.log(indent + "  Source: " + sourceDesc);
      console.log(indent + "  " + approvalDesc);

      if (opts.contracts) {
        const result = verificationResults.get(file.id);
        const status = result ? result.status : "unverified";
        console.log(indent + "  Contract: " + file.id + " (" + status + ")");
      }

      if (!isLast) {
        console.log(indent + "  " + chalk.gray("  |"));
        console.log(indent + "  " + chalk.gray("  v"));
      }
    }

    // Show children of the target unit
    const children = tree.childrenMap.get(unitId) || [];
    if (children.length > 0) {
      const indent = "  ".repeat(chain.length);
      console.log("");
      console.log(indent + chalk.gray("Sub-intents:"));
      for (const childId of children) {
        const child = tree.files.get(childId);
        if (child) {
          const src = formatSource(child);
          console.log(indent + "  - " + childId + " (" + src + ")");
        }
      }
    }
  });

function buildAncestryChain(tree: IntentTree, unitId: string): GlassFile[] {
  const chain: GlassFile[] = [];
  let currentId: string | null | undefined = unitId;

  while (currentId) {
    const file = tree.files.get(currentId);
    if (!file) break;
    chain.unshift(file);
    currentId = tree.parentMap.get(currentId);
  }

  return chain;
}

function formatSource(file: GlassFile): string {
  const src = file.intent.source;
  switch (src.kind) {
    case "prd":
      return "PRD " + src.reference;
    case "conversation":
      return "Conversation #" + src.sessionId + (src.quote ? " — \"" + src.quote + "\"" : "");
    case "ai-generated":
      return "AI-generated (" + src.reason + ")";
  }
}

function formatApproval(file: GlassFile): string {
  switch (file.intent.approvalStatus) {
    case "approved":
      return chalk.green("Approved");
    case "auto-approved":
      return chalk.blue("Auto-approved");
    case "pending":
      return chalk.yellow("Pending approval");
    default:
      return file.intent.approvalStatus;
  }
}
