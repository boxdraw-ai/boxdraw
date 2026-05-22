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

## Install (Claude Code / Cursor / Cline / Zed)

One command wires boxdraw's MCP server into every agent it detects on
your machine:

```sh
npx @boxdraw-ai/cli install
```

The CLI walks you through it: detects your agents, asks for an email, and writes
the right `Authorization: Bearer ...` config into each agent's MCP
settings.

After install, ask your agent something like:

> Draw me a diagram of a request flow: client → load balancer → three
> API replicas → shared postgres. Label the LB edge "round-robin."

## What's in this repo

- **[`boxdraw-cli/`](./boxdraw-cli/)** — source for the
  [`@boxdraw-ai/cli`](https://www.npmjs.com/package/@boxdraw-ai/cli) NPM
  package that `npx @boxdraw-ai/cli install` runs. MIT-licensed; audit
  before running if you'd like.
- **[`fonts/BoxDraw-Flex-Mono/`](./fonts/BoxDraw-Flex-Mono/)** —
  _BoxDraw Flex Mono_, a variable-axis monospace font tuned for
  box-drawing characters. OFL-licensed (see
  `fonts/BoxDraw-Flex-Mono/OFL.txt`).
- **[`fonts/BoxDraw-Mono/`](./fonts/BoxDraw-Mono/)** — _BoxDraw Mono_,
  the static-width companion font. Same license.
- **[`releases/`](./releases/)** — zipped font bundles for direct
  download. Each release tag corresponds to a `releases/v*.zip` here.

## Filing issues

[Open an issue →](https://github.com/boxdraw-ai/boxdraw/issues/new)

Helpful things to include: the diagram JSON that misbehaved, what you
expected vs. what you got, and (if relevant) which agent + OS you were
on. Bug reports against the live service + about the CLI are both
welcome here.

## What's NOT in this repo

The hosted service code (the renderer, server, web editor) isn't
open source — boxdraw is a hosted product, not a self-hostable one.
This repo carries two free mono-spaced fonts, the CLI, and a place
to file issues.

## License

- **CLI** (`boxdraw-cli/`): MIT (see `boxdraw-cli/LICENSE`).
- **Fonts** (`fonts/BoxDraw-Flex-Mono/`, `fonts/BoxDraw-Mono/`):
  SIL Open Font License 1.1 (see each font's `OFL.txt`).
