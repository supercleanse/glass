#!/usr/bin/env node

/**
 * Glass CLI — command-line interface for the Glass framework.
 *
 * Usage:
 *   glass build [options]      Compile Glass source files
 *   glass verify [options]     Run verification checks
 *   glass init [options]       Initialize a new Glass project
 *   glass audit [options]      Display the audit trail
 */

import { Command } from "commander";
import { buildCommand } from "./commands/build";
import { verifyCommand } from "./commands/verify";
import { initCommand } from "./commands/init";
import { auditCommand } from "./commands/audit";
import { VERSION } from "../index";

const program = new Command();

program
  .name("glass")
  .description("Glass Framework — AI-authored, human-auditable, formally verified")
  .version(VERSION);

program.addCommand(buildCommand);
program.addCommand(verifyCommand);
program.addCommand(initCommand);
program.addCommand(auditCommand);

program.parse(process.argv);
