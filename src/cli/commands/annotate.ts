/**
 * glass annotate — attach human annotations to generated outlines.
 * @fails ProjectNotFound | UnitNotFound | AnnotationNotFound | InvalidTarget
 */

import { Command } from "commander";
import chalk from "chalk";
import * as path from "path";
import { loadProject } from "../utils";
import {
  addAnnotation,
  loadAnnotations,
  resolveAnnotation,
  getUnresolvedAnnotations,
} from "../../compiler/annotations";

export const annotateCommand = new Command("annotate")
  .description("Add or manage annotations on Glass units")
  .argument("<unitId>", "Glass unit ID to annotate")
  .argument("[target]", "Target: line:<n> or dotted path (e.g., contract.guarantees.success.2)")
  .argument("[note]", "Annotation text")
  .option("-s, --source <dir>", "Source directory", "src")
  .option("-a, --annotations <dir>", "Annotations directory", "annotations")
  .option("--author <name>", "Annotation author", "human")
  .option("--resolve <id>", "Resolve an annotation by ID")
  .option("--list", "List all annotations for the unit", false)
  .option("--unresolved", "List all unresolved annotations", false)
  .action(async (unitId: string, target: string | undefined, note: string | undefined, opts) => {
    const annotationsDir = path.resolve(opts.annotations);

    // List unresolved annotations across all units
    if (opts.unresolved) {
      const unresolved = getUnresolvedAnnotations(annotationsDir);
      if (unresolved.length === 0) {
        console.log(chalk.green("No unresolved annotations."));
        return;
      }
      console.log(chalk.bold("Unresolved Annotations: " + unresolved.length + "\n"));
      for (const ann of unresolved) {
        console.log(chalk.yellow("  " + ann.id));
        console.log("    Unit: " + ann.unitId);
        console.log("    Target: " + ann.target);
        console.log("    Note: " + ann.note);
        console.log("    Author: " + ann.author + " (" + ann.timestamp + ")");
        console.log("");
      }
      return;
    }

    // Validate unit exists
    const project = loadProject(opts.source);
    if (!project.ok) {
      console.error(chalk.red("Error:") + " " + project.error);
      process.exitCode = 1;
      return;
    }

    const unitExists = project.value.glassFiles.some((f) => f.id === unitId);
    if (!unitExists) {
      console.error(chalk.red("Error:") + " Unit not found: " + unitId);
      process.exitCode = 1;
      return;
    }

    // List annotations for the unit
    if (opts.list) {
      const annotations = loadAnnotations(annotationsDir, unitId);
      if (annotations.length === 0) {
        console.log("No annotations for " + unitId);
        return;
      }
      console.log(chalk.bold("Annotations for " + unitId + ":\n"));
      for (const ann of annotations) {
        const status = ann.resolved ? chalk.green("[resolved]") : chalk.yellow("[open]");
        console.log("  " + status + " " + ann.id);
        console.log("    Target: " + ann.target);
        console.log("    Note: " + ann.note);
        console.log("    Author: " + ann.author + " (" + ann.timestamp + ")");
        console.log("");
      }
      return;
    }

    // Resolve an annotation
    if (opts.resolve) {
      const result = resolveAnnotation(annotationsDir, unitId, opts.resolve);
      if (!result.ok) {
        console.error(chalk.red("Error:") + " " + result.error.message);
        process.exitCode = 1;
        return;
      }
      console.log(chalk.green("Resolved:") + " " + opts.resolve);
      return;
    }

    // Add a new annotation
    if (!target || !note) {
      console.error(chalk.red("Error:") + " Both target and note are required to add an annotation.");
      console.error("Usage: glass annotate <unitId> <target> <note>");
      process.exitCode = 1;
      return;
    }

    const result = addAnnotation(annotationsDir, unitId, target, note, opts.author);
    if (!result.ok) {
      console.error(chalk.red("Error:") + " " + result.error.message);
      process.exitCode = 1;
      return;
    }

    console.log(chalk.green("Added annotation:") + " " + result.value.id);
    console.log("  Unit: " + unitId);
    console.log("  Target: " + target);
    console.log("  Note: " + note);
  });
