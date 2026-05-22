/**
 * `boxdraw install` — the headline command.
 *
 * Flow (clack-prompts driven):
 *   1. Header + the install-flow diagram (rendered by boxdraw itself —
 *      meta on purpose; this is the product demoing itself).
 *   2. Scan the machine for known agent configs.
 *   3. If any found, ask which to wire up (default: all).
 *   4. Email gate — optional, skippable. Server emails a token, user
 *      pastes it back. Watermarked tier on skip.
 *   5. For each chosen agent: backup, splice boxdraw into its MCP
 *      config, write back.
 *   6. Confirmation + first-prompt suggestion.
 *
 * `--dry-run` short-circuits step 5 (everything else still runs so
 * the user sees exactly what would happen). `--uninstall` reverses
 * step 5 across every agent that has a `boxdraw` entry.
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';

import {
  AGENTS,
  applyInstall,
  applyUninstall,
  detectAgents,
  type AgentId,
  type DetectedAgent,
} from '../agents.js';
import { INSTALL_FLOW_ASCII } from '../diagram.js';
import { requestApiKey, validateApiKey } from '../registration.js';
import { installSkill, uninstallSkill } from '../skills.js';

const DEFAULT_SERVER_URL = 'https://api.boxdraw.ai/mcp';

type Flags = {
  dryRun: boolean;
  uninstall: boolean;
  agents: AgentId[];
  serverUrl: string;
};

export async function runInstall(argv: string[]): Promise<number> {
  const flags = parseFlags(argv);
  if (flags.uninstall) return await runUninstall(flags);

  // Branded greeting + the install-flow diagram itself, rendered by
  // boxdraw. Yes, we're using the product to advertise the product.
  printHeader();
  process.stdout.write(INSTALL_FLOW_ASCII);
  process.stdout.write('\n\n');

  p.intro(pc.bgYellow(pc.black(' boxdraw install ')));

  // ── 1. Detect ────────────────────────────────────────────────────
  const detected = detectAgents();
  if (detected.length === 0) {
    p.note(
      `Couldn't find Claude Code, Cursor, Cline, or Zed on this machine.\n` +
        `Install one of them first, then run \`npx @boxdraw-ai/cli install\` again.\n` +
        `If you think this is wrong, run with --agent <name> to force.`,
      'no agents found',
    );
    p.outro(pc.dim('aborted'));
    return 1;
  }

  p.log.success(
    `found ${pc.bold(detected.length.toString())} agent${detected.length === 1 ? '' : 's'}: ` +
      detected.map((a) => pc.cyan(a.label)).join(', '),
  );

  // ── 2. Pick which to install into ────────────────────────────────
  const targets = await chooseTargets(detected, flags);
  if (targets.length === 0) {
    p.outro(pc.dim('nothing selected — aborted'));
    return 0;
  }

  // ── 3. Email + API key ───────────────────────────────────────────
  // We need an email to send the API key to. boxdraw itself is free,
  // but the email is the exchange — no anonymous tier.
  const result = await emailRegistration();
  if (result === 'cancel') {
    p.outro(pc.dim('cancelled'));
    return 0;
  }
  const token = result.token;

  // ── 4. Write configs ─────────────────────────────────────────────
  const verb = flags.dryRun ? pc.dim('would write') : pc.green('wrote');
  for (const agent of targets) {
    const result = applyInstall(agent, flags.serverUrl, token, { dryRun: flags.dryRun });
    if (result.written || flags.dryRun) {
      p.log.message(`${verb} ${pc.cyan(agent.label)} → ${pc.dim(result.path)}`);
    } else {
      p.log.message(`${pc.dim('no change')} ${pc.cyan(agent.label)} (already wired)`);
    }
    // Skills are Claude-Code-only today (other agents lack the file
    // contract). installSkill short-circuits on agents without a
    // skillsDir.
    const skill = installSkill(agent, { dryRun: flags.dryRun });
    if (skill.applicable && skill.written) {
      p.log.message(`${verb} ${pc.cyan(agent.label)} skill → ${pc.dim(skill.path!)}`);
    }
  }

  // ── 5. Done ──────────────────────────────────────────────────────
  if (flags.dryRun) {
    p.outro(pc.yellow('--dry-run: nothing was written. drop the flag to run for real.'));
    return 0;
  }

  printFinishedTip(targets);
  p.outro(pc.bold('boxdraw is ready. ask your agent to draw something.'));
  return 0;
}

async function runUninstall(flags: Flags): Promise<number> {
  p.intro(pc.bgRed(pc.white(' boxdraw uninstall ')));

  let touched = 0;
  for (const agent of AGENTS) {
    const did = applyUninstall(agent, { dryRun: flags.dryRun });
    if (did) {
      p.log.message(
        `${flags.dryRun ? pc.dim('would remove') : pc.green('removed')} ${pc.cyan(agent.label)}`,
      );
      touched++;
    }
    // Also strip the skill bundle (Claude Code only — short-circuits
    // on agents without a skillsDir).
    const skill = uninstallSkill(agent, { dryRun: flags.dryRun });
    if (skill.applicable && skill.removed) {
      p.log.message(
        `${flags.dryRun ? pc.dim('would remove') : pc.green('removed')} ${pc.cyan(agent.label)} skill → ${pc.dim(skill.path!)}`,
      );
      touched++;
    }
  }
  if (touched === 0) {
    p.outro(pc.dim('nothing to uninstall — boxdraw was not wired into any agent.'));
    return 0;
  }

  p.outro(
    flags.dryRun
      ? pc.yellow(`--dry-run: ${touched} would be cleaned up.`)
      : pc.bold(`uninstalled from ${touched} agent${touched === 1 ? '' : 's'}.`),
  );
  return 0;
}

// ── pieces ──────────────────────────────────────────────────────────

function printHeader(): void {
  // Two-line ASCII logo + URL + tagline. Logo rendered in a single
  // foreground color (not gradient) so it stays sharp across every
  // terminal palette. Tagline + URL get dimmed so the logo carries
  // the eye and the rest reads as "metadata about the brand."
  process.stdout.write('\n');
  process.stdout.write('  ├─╮╭─╮╮╭╭─┤╭─╭─┐╷ ╷ ╷ ╭─┐╷\n');
  process.stdout.write('  ╰─╯╰─╯╯╰╰─╯╵ ╰─┘╰─┴─╯╹╰─┘╵\n');
  process.stdout.write(pc.dim('  https://boxdraw.ai\n\n'));
  process.stdout.write('  Unicode diagrams in Markdown.\n');
  process.stdout.write(pc.dim('  Drawn by you, or drawn by an LLM.\n\n'));
}

async function chooseTargets(
  detected: DetectedAgent[],
  flags: Flags,
): Promise<DetectedAgent[]> {
  // If --agent was passed, narrow without prompting. Anything not in
  // the detected list silently drops (we already told the user what
  // was found above).
  if (flags.agents.length > 0) {
    return detected.filter((a) => flags.agents.includes(a.id));
  }

  // Single agent — no point asking.
  if (detected.length === 1) return detected;

  // Default path: a clean binary. 95% of users want "all" — show
  // that as the default highlighted option so a single Enter takes
  // it. The multiselect-as-default UX (with checkboxes you have to
  // toggle) is genuinely confusing because it's not obvious whether
  // the items are pre-selected or not. Hide it behind an opt-in.
  const choice = await p.select({
    message: `add boxdraw to these ${detected.length} agents?`,
    options: [
      { value: 'all', label: 'yes' },
      { value: 'pick', label: 'pick which agents to add to' },
    ],
    initialValue: 'all',
  });

  if (p.isCancel(choice)) return [];
  if (choice === 'all') return detected;

  // "pick" path — only here do we show the multiselect. The user
  // explicitly opted in to the per-agent toggles, so we trust they
  // know what's going on.
  const picked = await p.multiselect({
    message:
      'pick agent(s):\n' +
      pc.dim('  (spacebar toggles · arrows move · Enter confirms)'),
    options: detected.map((a) => ({
      value: a.id,
      label: a.label,
      hint: a.configExists ? 'config exists, will be merged' : 'will create config',
    })),
    initialValues: detected.map((a) => a.id),
    required: false,
  });

  if (p.isCancel(picked)) return [];
  return detected.filter((a) => (picked as AgentId[]).includes(a.id));
}

async function emailRegistration(): Promise<{ token: string } | 'cancel'> {
  p.log.info(
    `boxdraw is ${pc.bold('free')}. we just need an email to send you your` +
      `\n  API key — and to ping you about outages or breaking changes.` +
      `\n  one prompt, no spam, unsubscribe per usual.`,
  );

  const emailRaw = await p.text({
    message: 'email (so we can send you an API key)',
    placeholder: 'you@example.com',
    defaultValue: '',
    validate: (v) => {
      const s = (v ?? '').trim();
      if (!s) return 'email is required — we use it to send you the API key';
      if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(s)) return "doesn't look like an email";
      return undefined;
    },
  });
  if (p.isCancel(emailRaw)) return 'cancel';
  const email = (emailRaw ?? '').trim();

  const sending = p.spinner();
  sending.start('emailing you an API key…');
  const sent = await requestApiKey(email);
  sending.stop(sent.ok ? 'sent — check your inbox' : `couldn't send: ${sent.reason}`);
  if (!sent.ok) return 'cancel';

  const pastedRaw = await p.text({
    message: 'paste the API key from the email',
    placeholder: 'bxd_…',
    defaultValue: '',
    validate: (v) => {
      const r = validateApiKey(v ?? '');
      return r.ok ? undefined : r.reason;
    },
  });
  if (p.isCancel(pastedRaw)) return 'cancel';

  const result = validateApiKey((pastedRaw ?? '').trim());
  if (!result.ok) return 'cancel'; // validate also runs above; redundant but typesafe
  return { token: result.token };
}

function printFinishedTip(targets: DetectedAgent[]): void {
  const sample = targets[0]?.label ?? 'your agent';
  p.note(
    `Try this in ${pc.cyan(sample)}:\n\n` +
      pc.italic(
        '  draw me a diagram of the request flow: client → load balancer →\n' +
          '  three API replicas → shared postgres. label the LB edge "round-robin".',
      ),
    'first prompt',
  );
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = {
    dryRun: false,
    uninstall: false,
    agents: [],
    serverUrl: DEFAULT_SERVER_URL,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--dry-run':
        flags.dryRun = true;
        break;
      case '--uninstall':
        flags.uninstall = true;
        break;
      case '--agent': {
        const v = argv[++i];
        if (!v) throw new Error('--agent needs a value');
        flags.agents.push(v as AgentId);
        break;
      }
      case '--server': {
        const v = argv[++i];
        if (!v) throw new Error('--server needs a URL');
        flags.serverUrl = v;
        break;
      }
      default:
        throw new Error(`unknown flag: ${a}`);
    }
  }
  return flags;
}
