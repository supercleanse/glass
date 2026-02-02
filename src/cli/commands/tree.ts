/**
 * glass tree — display the intent hierarchy as an ASCII tree.
 * @fails ProjectNotFound
 */

import { Command } from "commander";
import chalk from "chalk";
import { loadProject } from "../utils";
import type { IntentTree } from "../../types/index";

export const treeCommand = new Command("tree")
  .description("Display the intent hierarchy tree")
  .option("-s, --source <dir>", "Source directory", "src")
  .option("-d, --depth <n>", "Maximum tree depth")
  .action(async (opts) => {
    const project = loadProject(opts.source);
    if (!project.ok) {
      console.error(chalk.red("Error:") + " " + project.error);
      process.exitCode = 1;
      return;
    }

    const { tree } = project.value;
    const maxDepth = opts.depth ? parseInt(opts.depth, 10) : Infinity;

    for (let i = 0; i < tree.roots.length; i++) {
      const isLast = i === tree.roots.length - 1;
      renderTreeNode(tree, tree.roots[i], "", isLast, 0, maxDepth);
    }
  });

function renderTreeNode(
  tree: IntentTree,
  id: string,
  prefix: string,
  isLast: boolean,
  depth: number,
  maxDepth: number,
): void {
  const file = tree.files.get(id);
  if (!file) return;

  const connector = isLast ? "└── " : "├── ";
  const sourceStr = formatSourceTag(file.intent.source.kind);
  const approvalStr = file.intent.approvalStatus;

  console.log(prefix + connector + file.id + " (" + sourceStr + ", " + approvalStr + ")");

  if (depth >= maxDepth) return;

  const children = tree.childrenMap.get(id) || [];
  const childPrefix = prefix + (isLast ? "    " : "│   ");
  for (let i = 0; i < children.length; i++) {
    const childIsLast = i === children.length - 1;
    renderTreeNode(tree, children[i], childPrefix, childIsLast, depth + 1, maxDepth);
  }
}

function formatSourceTag(kind: string): string {
  switch (kind) {
    case "prd": return "PRD";
    case "conversation": return "conversation";
    case "ai-generated": return "AI-generated";
    default: return kind;
  }
}
