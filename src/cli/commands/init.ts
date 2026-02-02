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
    const name = inPlace ? path.basename(targetDir) : nameArg;

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

    console.log(chalk.green("  +") + " Created manifest.glass");
    console.log(chalk.green("  +") + " Created glass.config.json");
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
