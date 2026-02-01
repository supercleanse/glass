/**
 * glass audit — display the audit trail for compiled units.
 */

import { Command } from "commander";
import chalk from "chalk";

export const auditCommand = new Command("audit")
  .description("Display the audit trail for Glass units")
  .option("-u, --unit <id>", "Show audit for a specific unit")
  .option("-v, --verbose", "Show detailed audit information", false)
  .action(async (opts) => {
    console.log(chalk.blue("Glass") + " Audit trail");

    if (opts.unit) {
      console.log("Showing audit for unit: " + chalk.cyan(opts.unit));
    } else {
      console.log("No compiled units found. Run " + chalk.cyan("glass build") + " first.");
    }
  });
