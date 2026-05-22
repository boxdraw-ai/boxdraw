/**
 * Install / uninstall the boxdraw skill bundle.
 *
 * Claude Code reads `~/.claude/skills/<name>/SKILL.md` (and any
 * supporting files in the same directory) as a "skill" — domain
 * knowledge that loads into Claude's context when the description
 * matches what the user is asking for. Skills complement the MCP
 * server: the MCP gives the agent the *action* (`draw_diagram`),
 * the skill gives the *knowledge* (which type to pick, schema,
 * common pitfalls) so it can call the action correctly first try.
 *
 * Other agents we install for (Cursor, Cline, Zed) don't read
 * `.claude/skills/` — they get MCP only. The `skillsDir` field on
 * `Agent` is `undefined` for those, and `installSkill` short-circuits.
 *
 * The skill content lives at `<package-root>/skills/boxdraw/` as
 * static assets shipped in the npm tarball (see package.json `files`).
 * We resolve that dir relative to this file's URL so `npx @boxdraw-ai/cli`
 * finds the bundle wherever pnpm/npm staged the package.
 */

import {
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Agent } from './agents.ts';

/// Resolve `<package-root>/skills/boxdraw`. This file ends up at
/// `dist/skills.js` after the tsc build, so the bundle is one level
/// up from `dist/`. Works both during local `tsx src/cli.ts` runs
/// (skill bundle is at ../skills/boxdraw) and after `npm i boxdraw`
/// (same relative layout in node_modules/boxdraw/).
export function bundledSkillDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, '..', 'skills', 'boxdraw');
}

export type SkillInstallResult = {
  /// `false` when the agent doesn't accept skills (no `skillsDir`).
  applicable: boolean;
  /// `true` if we actually wrote anything (or would have, in dry-run).
  written: boolean;
  /// Destination dir we wrote into (or would write into).
  path?: string;
};

/// Copy the bundled skill into the agent's skills directory. No-op
/// for agents without a `skillsDir`. Idempotent — re-running just
/// overwrites the destination.
export function installSkill(
  agent: Agent,
  opts: { dryRun: boolean },
): SkillInstallResult {
  if (!agent.skillsDir) return { applicable: false, written: false };

  const src = bundledSkillDir();
  if (!existsSync(src) || !statSync(src).isDirectory()) {
    throw new Error(
      `boxdraw skill bundle missing at ${src} — this is a packaging bug, ` +
        `please file an issue.`,
    );
  }

  if (opts.dryRun) {
    return { applicable: true, written: true, path: agent.skillsDir };
  }

  mkdirSync(dirname(agent.skillsDir), { recursive: true });
  cpSync(src, agent.skillsDir, { recursive: true });

  return { applicable: true, written: true, path: agent.skillsDir };
}

export type SkillUninstallResult = {
  applicable: boolean;
  removed: boolean;
  path?: string;
};

/// Remove the boxdraw skill from the agent's skills directory.
/// Leaves the parent `.claude/skills/` directory intact even if it
/// becomes empty — other skills may live there.
export function uninstallSkill(
  agent: Agent,
  opts: { dryRun: boolean },
): SkillUninstallResult {
  if (!agent.skillsDir) return { applicable: false, removed: false };

  if (!existsSync(agent.skillsDir)) {
    return { applicable: true, removed: false, path: agent.skillsDir };
  }

  if (opts.dryRun) {
    return { applicable: true, removed: true, path: agent.skillsDir };
  }

  rmSync(agent.skillsDir, { recursive: true, force: true });
  return { applicable: true, removed: true, path: agent.skillsDir };
}
