```
├─╮╭─╮╮╭╭─┤╭─╭─┐╷ ╷ ╷ ╭─┐╷
╰─╯╰─╯╯╰╰─╯╵ ╰─┘╰─┴─╯╹╰─┘╵
Unicode diagrams in Markdown.
Drawn by you, or drawn by an LLM.

╭───────────╮     ╭────────────╮     ╭───────────╮
│ your idea ├────▶│ small JSON ├────▶│ ASCII art │
╰───────────╯     ╰────────────╯     ╰───────────╯
```

**Text-native diagrams for AI agents and humans.** boxdraw turns small
JSON descriptions into Unicode box-drawing art that LLMs can read,
edit, and paste into Markdown. See the live editor + docs at
[**boxdraw.ai**](https://boxdraw.ai).

One command wires boxdraw's MCP server into your AI agent:

```sh
npx @boxdraw-ai/cli install
```

Auto-detects Claude Code, Cursor, Cline, and Zed. Splices boxdraw's MCP server into each one's config (with a backup), wires up your API key, and tells you what it did.

## Usage

```sh
npx @boxdraw-ai/cli install               # the happy path
npx @boxdraw-ai/cli install --dry-run     # show what would change, no writes
npx @boxdraw-ai/cli install --uninstall   # remove boxdraw from every agent
npx @boxdraw-ai/cli install --agent zed   # only wire one agent (repeat the flag)
```

## What it touches

```
╭─────────────────┬────────────────────────────────────────────────────────────────────────────────╮
│ Agent           │ Config file                                                                    │
├─────────────────┼────────────────────────────────────────────────────────────────────────────────┤
│ Claude Code     │ ~/.claude.json                                                                 │
│ Cursor          │ ~/.cursor/mcp.json                                                             │
│ Cline (VS Code) │ .../User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json │
│ Zed             │ ~/.config/zed/settings.json                                                    │
╰─────────────────┴────────────────────────────────────────────────────────────────────────────────╯
```

Every first write is preceded by a `<file>.boxdraw.bak` backup. Everything else in the file is left alone — we only add a `boxdraw` entry to the agent's MCP server list.

## Why we ask for an email

boxdraw is **free**, but the install flow asks for an email so we can send you an API key and ping you about outages or breaking changes. One prompt, no spam, unsubscribe per usual. The CLI won't write any agent configs until the key arrives in your inbox and you paste it back.

## Development

```sh
pnpm install
pnpm dev install --dry-run --skip-email   # run from source
pnpm regen-flow-ascii                     # refresh the install-flow diagram
pnpm build                                # produce dist/ for npm publish
```

## License

MIT.
