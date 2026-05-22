#!/usr/bin/env node
/**
 * boxdraw — command-line entry point.
 *
 * Today there's just `install`, which connects boxdraw.ai's MCP server
 * to whichever agent (Claude Code / Cursor / Cline / Zed) the user has
 * on their machine. Future verbs (`status`, `unregister`, `whoami`, …)
 * land in this same dispatch table.
 *
 *   npx @boxdraw-ai/cli install
 *   npx @boxdraw-ai/cli install --dry-run
 *   npx @boxdraw-ai/cli install --uninstall
 */

import { runInstall } from './commands/install.js';

const VERSION = '0.1.0';

const HELP = `boxdraw — diagrams as text, via your AI agent

Usage:
  npx @boxdraw-ai/cli install [options]   Wire boxdraw's MCP server into your agent(s)
  npx @boxdraw-ai/cli --version           Print the CLI version
  npx @boxdraw-ai/cli --help              Print this help

Install options:
  --dry-run        Show what would be written, don't touch any files
  --uninstall      Remove boxdraw from every agent config it's wired into
  --agent <name>   Install only into the named agent (claude-code, cursor,
                   cline, zed). Repeat the flag for multiple. Default: all
                   detected.
  --server <url>   Override the MCP server URL (default: https://api.boxdraw.ai/mcp)

Read more: https://boxdraw.ai
`;

async function main(): Promise<number> {
  const argv = process.argv.slice(2);

  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h') {
    process.stdout.write(HELP);
    return 0;
  }

  if (argv[0] === '--version' || argv[0] === '-v') {
    process.stdout.write(`boxdraw ${VERSION}\n`);
    return 0;
  }

  switch (argv[0]) {
    case 'install':
      return await runInstall(argv.slice(1));
    default:
      process.stderr.write(`boxdraw: unknown command "${argv[0]}"\n\n${HELP}`);
      return 1;
  }
}

main().then(
  (code) => process.exit(code),
  (err) => {
    process.stderr.write(`boxdraw: ${err?.message ?? err}\n`);
    process.exit(1);
  },
);
