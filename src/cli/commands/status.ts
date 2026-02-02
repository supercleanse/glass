/**
 * glass status — display verification status dashboard.
 * @fails ProjectNotFound
 */

import { Command } from "commander";
import chalk from "chalk";
import { loadProject, loadGlassConfig, resolveGlassDir, resolveSourceDir } from "../utils";

export const statusCommand = new Command("status")
  .description("Display verification status dashboard")
  .option("-g, --glass-dir <dir>", "Glass spec directory")
  .option("-s, --source <dir>", "Implementation source directory")
  .action(async (opts) => {
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

    const { glassFiles, verificationResults } = project.value;

    let verified = 0;
    let failed = 0;
    let withAdvisories = 0;

    for (const [, result] of verificationResults) {
      if (result.status === "PROVEN") {
        verified++;
        if (result.advisories.length > 0) withAdvisories++;
      } else {
        failed++;
      }
    }

    console.log(chalk.bold("GLASS PROJECT STATUS\n"));
    console.log("Units: " + glassFiles.length + " total");
    console.log(chalk.green("  + " + verified + " verified"));
    if (withAdvisories > 0) {
      console.log(chalk.yellow("  ! " + withAdvisories + " with advisories"));
    }
    if (failed > 0) {
      console.log(chalk.red("  x " + failed + " failed"));
    }

    // Pending approvals
    const pendingApprovals = glassFiles.filter(
      (f) => f.intent.approvalStatus === "pending",
    );
    if (pendingApprovals.length > 0) {
      console.log("\nPending Approvals: " + pendingApprovals.length);
      for (const file of pendingApprovals) {
        const annotations = file.intent.subIntents
          .filter((s) => s.annotations)
          .flatMap((s) => s.annotations || []);
        const suffix = annotations.length > 0 ? " (" + annotations.join(", ") + ")" : "";
        console.log("  - " + file.id + suffix);
      }
    }

    // Per-unit status
    console.log("\nPer-Unit Status:");
    for (const [unitId, result] of verificationResults) {
      const advisoryCount = result.advisories.length;
      if (result.status === "FAILED") {
        console.log(chalk.red("  x " + unitId + " (FAILED)"));
      } else if (advisoryCount > 0) {
        console.log(chalk.yellow("  ! " + unitId + " (PROVEN, " + advisoryCount + " advisory)"));
      } else {
        console.log(chalk.green("  + " + unitId + " (PROVEN)"));
      }
    }
  });
