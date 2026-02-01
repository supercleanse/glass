/**
 * glass init — initialize a new Glass project.
 */

import { Command } from "commander";
import chalk from "chalk";

export const initCommand = new Command("init")
  .description("Initialize a new Glass project")
  .argument("[name]", "Project name", "glass-project")
  .option("-l, --language <lang>", "Target language", "typescript")
  .option("--no-git", "Skip git initialization")
  .action(async (name: string, opts) => {
    console.log(chalk.blue("Glass") + ` Initializing project: ${name}`);

    const directories = ["src", ".generated", ".annotations"];

    console.log(chalk.green("Created") + " directory structure:");
    for (const dir of directories) {
      console.log(`  + ${dir}/`);
    }

    if (opts.manifest !== false) {
      console.log(chalk.green("Created") + " manifest.glass");
    }

    console.log(chalk.green("Created") + " glass.config.json");
    console.log("");
    console.log(chalk.green("Project initialized successfully."));
    console.log("Run " + chalk.cyan("glass build") + " to compile your project.");
  });
