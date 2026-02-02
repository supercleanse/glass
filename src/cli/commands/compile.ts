/**
 * glass compile — run full compilation pipeline: parse, link, verify, generate views, emit.
 */

import { Command } from "commander";
import chalk from "chalk";
import { loadProject } from "../utils";
import { emitTypeScript } from "../../compiler/emitter";
import { generateAllViews } from "../../compiler/view-generator";
import { generateInstrumentation } from "../../compiler/verifier";
import * as path from "path";

export const compileCommand = new Command("compile")
  .description("Run full Glass compilation pipeline")
  .option("-s, --source <dir>", "Source directory", "src")
  .option("-o, --output <dir>", "Output directory", "dist")
  .option("--no-verify", "Skip verification step")
  .option("--clean", "Clean output directory before emitting", false)
  .option("-v, --verbose", "Enable verbose output", false)
  .action(async (opts) => {
    const startTime = Date.now();

    // Step 1-4: Parse, link, verify
    console.log(chalk.blue("[1/6]") + " Parsing .glass files...");
    const project = loadProject(opts.source);
    if (!project.ok) {
      console.error(chalk.red("Error:") + " " + project.error);
      process.exitCode = 1;
      return;
    }
    console.log(chalk.green("[1/6]") + " Parsing .glass files... done");

    console.log(chalk.green("[2/6]") + " Linking intent tree... done");

    // Step 3-4: Verify
    console.log(chalk.blue("[3/6]") + " Verifying contracts...");
    const { glassFiles, tree, verificationResults } = project.value;

    let allPassed = true;
    let advisoryCount = 0;
    for (const [, result] of verificationResults) {
      if (result.status === "FAILED") allPassed = false;
      advisoryCount += result.advisories.length;
    }

    if (!allPassed && opts.verify !== false) {
      console.error(chalk.red("[3/6]") + " Verification failed — compilation aborted");
      for (const [unitId, result] of verificationResults) {
        if (result.status === "FAILED") {
          console.error(chalk.red("  x " + unitId + ": FAILED"));
        }
      }
      process.exitCode = 1;
      return;
    }

    const advisoryMsg = advisoryCount > 0 ? " (" + advisoryCount + " advisories)" : "";
    console.log(chalk.green("[4/6]") + " Verifying contracts... done" + advisoryMsg);

    // Step 5: Generate views
    console.log(chalk.blue("[5/6]") + " Generating views...");
    const viewsDir = path.join(path.dirname(opts.source), "glass-views");
    generateAllViews(glassFiles, tree, verificationResults, viewsDir);
    console.log(chalk.green("[5/6]") + " Generating views... done");

    // Step 6: Emit code
    console.log(chalk.blue("[6/6]") + " Emitting TypeScript...");

    // Generate instrumentation plans
    const instrumentationPlans = new Map<string, ReturnType<typeof generateInstrumentation>>();
    for (const file of glassFiles) {
      const result = verificationResults.get(file.id);
      if (result) {
        instrumentationPlans.set(file.id, generateInstrumentation(file, result));
      }
    }

    const emitResult = emitTypeScript(glassFiles, verificationResults, opts.output, {
      instrumentationPlans,
      cleanOutput: opts.clean,
    });

    if (!emitResult.ok) {
      console.error(chalk.red("[6/6]") + " Emit failed: " + emitResult.error.message);
      process.exitCode = 1;
      return;
    }

    console.log(chalk.green("[6/6]") + " Emitting TypeScript... done");

    const duration = Date.now() - startTime;
    console.log("");
    console.log(chalk.green("Compilation successful!") + " " + emitResult.value.length +
      " files emitted in " + duration + "ms");
    console.log("Output: " + opts.output + "/");
  });
