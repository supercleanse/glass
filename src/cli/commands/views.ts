/**
 * glass views — generate human-readable views without full compilation.
 * @fails ProjectNotFound | ViewGenerationFailed
 */

import { Command } from "commander";
import chalk from "chalk";
import * as path from "path";
import { loadProject } from "../utils";
import { generateAllViews } from "../../compiler/view-generator";

export const viewsCommand = new Command("views")
  .description("Generate human-readable views and dashboards")
  .option("-s, --source <dir>", "Source directory", "src")
  .option("-o, --output <dir>", "Output directory", "glass-views")
  .action(async (opts) => {
    console.log(chalk.blue("Glass") + " Generating views...\n");

    const project = loadProject(opts.source);
    if (!project.ok) {
      console.error(chalk.red("Error:") + " " + project.error);
      process.exitCode = 1;
      return;
    }

    const { glassFiles, tree, verificationResults } = project.value;
    const outputDir = path.resolve(opts.output);

    const result = generateAllViews(glassFiles, tree, verificationResults, outputDir);
    if (!result.ok) {
      console.error(chalk.red("Error:") + " " + result.error.message);
      process.exitCode = 1;
      return;
    }

    console.log(chalk.green("Generated " + result.value.length + " view files"));
    console.log("Output: " + outputDir + "/");
  });
