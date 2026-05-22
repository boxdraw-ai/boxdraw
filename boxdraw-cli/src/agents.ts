/**
 * Per-agent integration: where their MCP config lives, how to detect
 * the agent's presence, and how to splice boxdraw's server entry into
 * their JSON without disturbing the rest.
 *
 * Each agent has a slightly different home:
 *   - Claude Code   — `~/.claude.json` (top-level `mcpServers`)
 *   - Cursor        — `~/.cursor/mcp.json` (top-level `mcpServers`)
 *   - Cline (VSCode)— `…/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
 *   - Zed           — `~/.config/zed/settings.json` (`context_servers`)
 *
 * For now we treat "detection" as "the parent dir exists" — the user
 * obviously has the agent installed. We never *create* an agent's
 * config dir from scratch (too presumptuous).
 *
 * Every write is preceded by a backup copy at `<file>.boxdraw.bak`
 * so `--uninstall` (or a manual revert) is one shell command away.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { dirname, join } from 'node:path';

export type AgentId = 'claude-code' | 'cursor' | 'cline' | 'zed';

export type Agent = {
  id: AgentId;
  /// Human label shown in prompts ("Claude Code", not "claude-code").
  label: string;
  /// Path to the config file we'll edit. Resolved per-platform.
  configPath: string;
  /// Path/dir whose existence indicates the agent is installed.
  detectPath: string;
  /// JSON shape for boxdraw's server entry, parameterised by URL + token.
  serverEntry: (url: string, token?: string) => unknown;
  /// Where in the config JSON the entry goes (dotted key path).
  serverKey: string;
  /// Directory to drop the boxdraw SKILL bundle into. Set only for
  /// agents that support Claude's skill format (just Claude Code
  /// today). Other agents rely on MCP alone for capability discovery.
  skillsDir?: string;
};

const HOME = homedir();
const IS_MAC = platform() === 'darwin';
const IS_WIN = platform() === 'win32';

/// VSCode global storage dir on this platform — Cline lives inside it.
function vscodeGlobalStorage(): string {
  if (IS_MAC) {
    return join(HOME, 'Library', 'Application Support', 'Code', 'User', 'globalStorage');
  }
  if (IS_WIN) {
    return join(process.env.APPDATA ?? '', 'Code', 'User', 'globalStorage');
  }
  return join(HOME, '.config', 'Code', 'User', 'globalStorage');
}

export const AGENTS: Agent[] = [
  {
    id: 'claude-code',
    label: 'Claude Code',
    configPath: join(HOME, '.claude.json'),
    detectPath: join(HOME, '.claude.json'),
    serverKey: 'mcpServers',
    serverEntry: (url, token) => ({
      type: 'sse',
      url,
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
    }),
    skillsDir: join(HOME, '.claude', 'skills', 'boxdraw'),
  },
  {
    id: 'cursor',
    label: 'Cursor',
    configPath: join(HOME, '.cursor', 'mcp.json'),
    detectPath: join(HOME, '.cursor'),
    serverKey: 'mcpServers',
    serverEntry: (url, token) => ({
      url,
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
    }),
  },
  {
    id: 'cline',
    label: 'Cline (VS Code)',
    configPath: join(
      vscodeGlobalStorage(),
      'saoudrizwan.claude-dev',
      'settings',
      'cline_mcp_settings.json',
    ),
    detectPath: join(vscodeGlobalStorage(), 'saoudrizwan.claude-dev'),
    serverKey: 'mcpServers',
    serverEntry: (url, token) => ({
      url,
      transportType: 'sse',
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
    }),
  },
  {
    id: 'zed',
    label: 'Zed',
    configPath: join(HOME, '.config', 'zed', 'settings.json'),
    detectPath: join(HOME, '.config', 'zed'),
    serverKey: 'context_servers',
    serverEntry: (url, token) => ({
      command: {
        path: 'npx',
        args: ['-y', 'mcp-remote', url, ...(token ? ['--header', `Authorization: Bearer ${token}`] : [])],
      },
    }),
  },
];

export type DetectedAgent = Agent & { configExists: boolean };

/// Return every agent that looks installed on this machine. "Looks
/// installed" = the agent's detection path exists; we don't try to
/// run any binary or open any IDE.
export function detectAgents(): DetectedAgent[] {
  return AGENTS.filter((a) => existsSync(a.detectPath)).map((a) => ({
    ...a,
    configExists: existsSync(a.configPath),
  }));
}

/// Side-effect-free preview: what would change in this agent's config
/// if we ran the install? Returns the BEFORE and AFTER JSON strings
/// (pretty-printed) so the caller can show a diff or decide to skip.
export function previewInstall(
  agent: Agent,
  serverUrl: string,
  token?: string,
): { before: string; after: string; changed: boolean } {
  const current = readJsonOrEmpty(agent.configPath);
  const next = withBoxdrawEntry(current, agent, serverUrl, token);
  const before = JSON.stringify(current, null, 2);
  const after = JSON.stringify(next, null, 2);
  return { before, after, changed: before !== after };
}

/// Splice boxdraw into the agent config and write back to disk. Backs
/// up the original alongside it (`<path>.boxdraw.bak`) on first write.
export function applyInstall(
  agent: Agent,
  serverUrl: string,
  token: string | undefined,
  opts: { dryRun: boolean },
): { written: boolean; path: string } {
  if (opts.dryRun) return { written: false, path: agent.configPath };

  const current = readJsonOrEmpty(agent.configPath);
  const next = withBoxdrawEntry(current, agent, serverUrl, token);
  if (JSON.stringify(current) === JSON.stringify(next)) {
    return { written: false, path: agent.configPath };
  }

  // Make sure the parent directory exists (we don't create the
  // agent's *root* dir, but one level deep is fine).
  mkdirSync(dirname(agent.configPath), { recursive: true });

  // First-write backup so `--uninstall` (or a hand revert) has a known
  // restore point. Subsequent writes leave the backup alone.
  const bak = `${agent.configPath}.boxdraw.bak`;
  if (existsSync(agent.configPath) && !existsSync(bak)) {
    copyFileSync(agent.configPath, bak);
  }

  writeFileSync(agent.configPath, JSON.stringify(next, null, 2) + '\n');
  return { written: true, path: agent.configPath };
}

/// Pull boxdraw back out of the agent's config. Leaves the rest of
/// their settings alone. Returns true if anything actually changed.
export function applyUninstall(agent: Agent, opts: { dryRun: boolean }): boolean {
  if (!existsSync(agent.configPath)) return false;

  const current = readJsonOrEmpty(agent.configPath);
  const next = withoutBoxdrawEntry(current, agent);
  if (JSON.stringify(current) === JSON.stringify(next)) return false;

  if (opts.dryRun) return true;
  writeFileSync(agent.configPath, JSON.stringify(next, null, 2) + '\n');
  return true;
}

// ── internals ──────────────────────────────────────────────────────────

function readJsonOrEmpty(path: string): Record<string, unknown> {
  if (!existsSync(path)) return {};
  try {
    const text = readFileSync(path, 'utf-8');
    return text.trim() ? JSON.parse(text) : {};
  } catch {
    // The user has hand-edited their config into invalid JSON. Don't
    // throw it away — bail with empty so the caller can decide.
    return {};
  }
}

function withBoxdrawEntry(
  cfg: Record<string, unknown>,
  agent: Agent,
  url: string,
  token: string | undefined,
): Record<string, unknown> {
  const next = { ...cfg };
  const bucket = (next[agent.serverKey] ?? {}) as Record<string, unknown>;
  next[agent.serverKey] = { ...bucket, boxdraw: agent.serverEntry(url, token) };
  return next;
}

function withoutBoxdrawEntry(
  cfg: Record<string, unknown>,
  agent: Agent,
): Record<string, unknown> {
  const next = { ...cfg };
  const bucket = (next[agent.serverKey] ?? {}) as Record<string, unknown>;
  if (!('boxdraw' in bucket)) return cfg;
  const { boxdraw: _drop, ...rest } = bucket;
  void _drop;
  if (Object.keys(rest).length === 0) {
    delete next[agent.serverKey];
  } else {
    next[agent.serverKey] = rest;
  }
  return next;
}
