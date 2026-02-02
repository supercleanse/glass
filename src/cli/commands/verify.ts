/**
 * glass verify — run contract verification on all .glass files.
 * @fails ProjectNotFound | VerificationFailed
 */

import { Command } from "commander";
import chalk from "chalk";
import { loadProject } from "../utils";

export const verifyCommand = new Command("verify")
  .description("Run contract verification on Glass source files")
  .option("-s, --source <dir>", "Source directory", "src")
  .option("--failures-only", "Show only failed units", false)
  .option("-v, --verbose", "Enable verbose output", false)
  .action(async (opts) => {
    console.log(chalk.blue("Glass") + " Verifying...\n");

    const project = loadProject(opts.source);
    if (!project.ok) {
      console.error(chalk.red("Error:") + " " + project.error);
      process.exitCode = 1;
      return;
    }

    const { verificationResults } = project.value;
    let allPassed = true;
    let totalUnits = 0;
    let passedUnits = 0;
    let totalAdvisories = 0;

    for (const [unitId, result] of verificationResults) {
      totalUnits++;
      const passed = result.assertions.filter((a) => a.passed).length;
      const total = result.assertions.length;
      const advisoryCount = result.advisories.length;
      totalAdvisories += advisoryCount;

      if (result.status === "FAILED") {
        allPassed = false;
        const failed = total - passed;
        console.log(chalk.red("  x " + unitId + ": FAILED") + " (" + failed + "/" + total + " assertions failed)");
        if (opts.verbose) {
          for (const a of result.assertions.filter((a) => !a.passed)) {
            console.log(chalk.red("      - " + a.assertion + ": " + a.message));
          }
        }
      } else if (!opts.failuresOnly) {
        passedUnits++;
        if (advisoryCount > 0) {
          console.log(chalk.yellow("  ! " + unitId + ": PROVEN") + " with " + advisoryCount + " advisory");
        } else {
          console.log(chalk.green("  + " + unitId + ": PROVEN") + " (" + passed + "/" + total + " assertions)");
        }
      } else {
        passedUnits++;
      }
    }

    console.log("");
    console.log(chalk.bold("Summary:") + " " + passedUnits + "/" + totalUnits + " units verified" +
      (totalAdvisories > 0 ? ", " + totalAdvisories + " advisories" : ""));

    if (!allPassed) {
      process.exitCode = 1;
    }
  });
