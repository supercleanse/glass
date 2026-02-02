/**
 * glass views — generate human-readable views without full compilation.
 * @fails ProjectNotFound | ViewGenerationFailed
 */

import { Command } from "commander";
import chalk from "chalk";
import * as path from "path";
import { loadProject, loadGlassConfig, resolveGlassDir, resolveSourceDir } from "../utils";
import { generateAllViews } from "../../compiler/view-generator";

export const viewsCommand = new Command("views")
  .description("Generate human-readable views and dashboards")
  .option("-g, --glass-dir <dir>", "Glass spec directory")
  .option("-s, --source <dir>", "Implementation source directory")
  .option("-o, --output <dir>", "Output directory", "glass-views")
  .action(async (opts) => {
    console.log(chalk.blue("Glass") + " Generating views...\n");

    const projectRoot = process.cwd();
    const config = loadGlassConfig(projectRoot);
    const glassDir = opts.glassDir ?? config?.glassDir ?? "glass";
    const sourceDir = opts.source ?? config?.sourceDir ?? "src";
    const project = loadProject(glassDir, projectRoot, sourceDir);
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
