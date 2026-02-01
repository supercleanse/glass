/**
 * glass build — compile Glass source files through the full pipeline.
 */

import { Command } from "commander";
import chalk from "chalk";
import { GlassCompiler } from "../../compiler/index";
import type { CompilerOptions } from "../../types/index";

export const buildCommand = new Command("build")
  .description("Compile Glass source files")
  .option("-s, --source <dir>", "Source directory", "src")
  .option("-o, --output <dir>", "Output directory", "dist")
  .option("--strict", "Enable strict mode", true)
  .option("--no-source-map", "Disable source maps")
  .option("--no-declaration", "Disable declaration files")
  .option("-v, --verbose", "Enable verbose output", false)
  .action(async (opts) => {
    const options: Partial<CompilerOptions> = {
      rootDir: opts.source,
      outDir: opts.output,
      strict: opts.strict,
      sourceMap: opts.sourceMap,
      declaration: opts.declaration,
      verbose: opts.verbose,
    };

    const compiler = new GlassCompiler(options);

    console.log(chalk.blue("Glass") + " Compiling...");

    const result = await compiler.compile([]);

    for (const diag of result.diagnostics) {
      switch (diag.severity) {
        case "error":
          console.error(chalk.red("error[" + diag.code + "]") + ": " + diag.message);
          break;
        case "warning":
          console.warn(chalk.yellow("warn[" + diag.code + "]") + ": " + diag.message);
          break;
        case "info":
          if (opts.verbose) {
            console.log(chalk.gray("info[" + diag.code + "]") + ": " + diag.message);
          }
          break;
      }
    }

    if (result.success) {
      console.log(
        chalk.green("Build succeeded") + " in " + result.duration + "ms" +
        " (" + result.outputFiles.length + " files emitted)",
      );
    } else {
      console.error(chalk.red("Build failed") + " in " + result.duration + "ms");
      process.exitCode = 1;
    }
  });
