/**
 * glass verify — run verification checks without full compilation.
 */

import { Command } from "commander";
import chalk from "chalk";
import { parse } from "../../compiler/parser";
import { link } from "../../compiler/linker";
import { verify } from "../../compiler/verifier";
import type { CompilerOptions } from "../../types/index";

export const verifyCommand = new Command("verify")
  .description("Run verification checks on Glass source files")
  .option("-s, --source <dir>", "Source directory", "src")
  .option("--strict", "Enable strict mode", true)
  .option("-v, --verbose", "Enable verbose output", false)
  .action(async (opts) => {
    console.log(chalk.blue("Glass") + " Verifying...");

    const parseResult = parse([]);

    if (!parseResult.ast) {
      for (const diag of parseResult.diagnostics) {
        console.error(chalk.red("error[" + diag.code + "]") + ": " + diag.message);
      }
      process.exitCode = 1;
      return;
    }

    const linkResult = link(parseResult.ast);
    if (!linkResult.success) {
      for (const diag of linkResult.diagnostics) {
        if ((diag.severity as string) === "error") {
          console.error(chalk.red("error[" + diag.code + "]") + ": " + diag.message);
        }
      }
      process.exitCode = 1;
      return;
    }

    const options: CompilerOptions = {
      rootDir: opts.source,
      outDir: "dist",
      strict: opts.strict,
      sourceMap: false,
      declaration: false,
      verbose: opts.verbose,
    };

    const result = verify(linkResult.ast, options);

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

    if (result.valid) {
      console.log(
        chalk.green("Verification passed") +
        ": " + result.satisfiedConstraints + "/" + result.checkedConstraints + " constraints satisfied",
      );
    } else {
      console.error(
        chalk.red("Verification failed") +
        ": " + result.satisfiedConstraints + "/" + result.checkedConstraints + " constraints satisfied",
      );
      process.exitCode = 1;
    }
  });
