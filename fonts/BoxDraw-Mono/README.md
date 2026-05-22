# BoxDraw Mono

A free, modified version of [JetBrains Mono](https://www.jetbrains.com/lp/mono/)
tuned for **rendering text-mode diagrams and ASCII-art-bearing markdown**.
Three changes from stock JBM:

1. **Proper directional stems on `▲` and `▼`.** In stock JBM these are bare
   equilateral triangles — they read as "triangles" more than "up arrow /
   down arrow." BoxDraw Mono fuses each one with the matching half-line
   glyph (`╷` U+2577 below `▲`, `╵` U+2575 above `▼`) so they read at a
   glance as proper directional arrows.

2. **Vertical-dash glyphs (`┆ ┊ ╎`) re-spaced for seamless tiling.** Stock
   JBM puts ~90 units between dashes within a cell but ~190 between cells,
   so long vertical runs show a visible "extra gap" every cell boundary.
   BoxDraw Mono redraws each glyph with N evenly-spaced rectangles whose
   period divides the cell height exactly — vertical dashed lines now flow
   as a single continuous stroke across rows.

3. **No ligatures**, ever. Built from JetBrains Mono's NL ("No Ligatures")
   source variants, so `->` stays as two characters (it doesn't render as
   `→`), `<=` stays as `<=` (not `≤`), `==` stays as `==`, and so on. ASCII
   art and technical prose render exactly as typed. If you want JBM's
   ligatures, use stock [JetBrains Mono](https://www.jetbrains.com/lp/mono/)
   instead.

All three changes apply uniformly across **16 weights** (Thin → ExtraBold,
upright + italic) and ship in **TTF**, **WOFF**, and **WOFF2**.

It's a font for documentation people. We ship it because every diagram on
[boxdraw.ai](https://boxdraw.ai) renders better with these tweaks, and we
figured you might want them too.

## Install

### Desktop (macOS / Linux / Windows)

Open the `ttf/` folder, select all 16 files, and double-click → "Install Font".
Or drop them in the OS-specific font directory:

| OS      | Path                                   |
|---------|----------------------------------------|
| macOS   | `~/Library/Fonts/`                     |
| Linux   | `~/.local/share/fonts/`                |
| Windows | `%LOCALAPPDATA%\Microsoft\Windows\Fonts\` |

After install, the family will appear in font pickers as **"BoxDraw Mono"**.

### Web (CSS)

Drop the `woff2/` (or `woff/`) folder into your project's static assets.
Then in your CSS:

```css
@font-face {
  font-family: "BoxDraw Mono";
  src: url("/fonts/BoxDrawMono-Regular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "BoxDraw Mono";
  src: url("/fonts/BoxDrawMono-Bold.woff2") format("woff2");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
/* …repeat for the weights you want… */

code, pre {
  font-family: "BoxDraw Mono", ui-monospace, monospace;
  /* ASCII art tiles seamlessly at this exact line-height: */
  line-height: 1.32;
}
```

WOFF2 is ~33% the size of TTF, so prefer it for the web. Use WOFF as a
fallback only if you support browsers older than 2017.

## License

**SIL Open Font License v1.1** — same as JetBrains Mono, the upstream font.
See `OFL.txt` for the full text.

You can use BoxDraw Mono for anything (personal, commercial, embedding in
documents, web pages, software). You can redistribute it. You can modify
it further. The only restrictions:

- Don't sell it on its own.
- Don't claim authorship.
- Any further modifications you redistribute must also be under OFL, and
  must be renamed (you can't ship modifications under "BoxDraw Mono" either).

## Where it came from

Built for [boxdraw.ai](https://boxdraw.ai), a text-mode diagram tool that
renders ASCII art for AI agents to embed in documentation. The font tweaks
live at [github.com/boxdrawai/boxdraw-mono](https://github.com/boxdrawai/boxdraw-mono).

Original "JetBrains Mono" Copyright 2020 The JetBrains Mono Project Authors,
[github.com/JetBrains/JetBrainsMono](https://github.com/JetBrains/JetBrainsMono).
