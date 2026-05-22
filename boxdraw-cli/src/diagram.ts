/**
 * The install-flow diagram, baked in at build time.
 *
 * It's `boxdraw`'s own output, generated from
 * `diagrams/install-flow/diagram.json` via:
 *
 *   pnpm regen-flow-ascii
 *
 * We bake it as a string instead of fetching the live API on first
 * run because (a) we want zero network before the user has even said
 * yes, and (b) the install CLI is itself a billboard for the product
 * — showing boxdraw's output during install IS the demo.
 */

// The script `scripts/regen-flow-ascii.ts` writes this file; everything
// after the marker is the rendered ASCII. Don't hand-edit.
export const INSTALL_FLOW_ASCII = `                                        ╭───────────────────────────╮     ╭─────────────────────────╮
                                    ╭──▶│           scan            ├────▶│       your agents       │
                                    │   │ ~/.claude, ~/.cursor, …   │     │ claude · cursor · zed   │
                                    │   ╰───────────────────────────╯     ╰─────────────────────────╯
                                    │
                                    │
                                    │
            ╭─────────────────────╮ │        ╭─────────────────╮
╭─────╮     │                     ├─╯    ╭──▶│    register     │
│ You ├────▶│ npx @boxdraw-ai/cli install ├──────╯   │ email → token   │
╰─────╯     │                     ├─────╮    ╰─────────────────╯
            ╰─────────────────────╯     │
                                        │
                                        │
                                        │
                                        │   ╭──────────────────╮             ╭───────────────────╮
                                        ╰──▶│    wire it up    ├────────────▶│       done        │
                                            │ write MCP config │             │ go draw something │
                                            ╰──────────────────╯             ╰───────────────────╯`;
