#!/usr/bin/env node

/**
 * Glass CLI — command-line interface for the Glass framework.
 *
 * Usage:
 *   glass init <name>         Initialize a new Glass project
 *   glass verify [options]    Run verification checks
 *   glass compile [options]   Run full compilation pipeline
 *   glass views [options]     Generate human-readable views
 *   glass status [options]    Display verification status dashboard
 *   glass tree [options]      Display the intent hierarchy tree
 *   glass trace <unitId>      Show provenance chain for a unit
 *   glass eject [options]     Eject to standalone code
 *   glass build [options]     Compile Glass source files (legacy)
 *   glass audit [options]     Display the audit trail
 */

import { Command } from "commander";
import { initCommand } from "./commands/init";
import { verifyCommand } from "./commands/verify";
import { compileCommand } from "./commands/compile";
import { viewsCommand } from "./commands/views";
import { statusCommand } from "./commands/status";
import { treeCommand } from "./commands/tree";
import { traceCommand } from "./commands/trace";
import { ejectCommand } from "./commands/eject";
import { buildCommand } from "./commands/build";
import { auditCommand } from "./commands/audit";
import { VERSION } from "../index";

const program = new Command();

program
  .name("glass")
  .description("Glass Framework — AI-authored, human-auditable, formally verified")
  .version(VERSION);

// Core commands
program.addCommand(initCommand);
program.addCommand(verifyCommand);
program.addCommand(compileCommand);
program.addCommand(viewsCommand);
program.addCommand(statusCommand);
program.addCommand(treeCommand);
program.addCommand(traceCommand);
program.addCommand(ejectCommand);

// Legacy/additional commands
program.addCommand(buildCommand);
program.addCommand(auditCommand);

program.parse(process.argv);
