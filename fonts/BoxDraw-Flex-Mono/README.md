# BoxDraw Flex Mono

A free, modified version of [IBM Plex Mono](https://www.ibm.com/plex/)
tuned for **rendering text-mode diagrams and ASCII-art-bearing markdown**.
Three changes from stock Plex:

1. **Seven Geometric-Shape glyphs added.** Plex Mono ships full Box Drawing
   (`U+2500`–`U+257F`, all 128 chars) and Block Elements (`U+2580`–`U+259F`,
   all 32 chars), but the Geometric Shapes block is almost empty: out of
   the 43 glyphs in `U+25A0`–`U+25FF`, stock Plex covers exactly 1. The
   boxdraw renderer needs `▲ ▼ ▶ ◀ ► ◄ ◆` for arrowheads and node markers.
   BoxDraw Flex Mono adds those seven glyphs — transplanted at their exact
   proportions from JetBrains Mono (both fonts share UPM 1000 and a
   600-unit monospace advance, so the paths land in Plex's cell verbatim).
   The arrows and diamonds now read in the same family as the rest of your
   diagram instead of falling back to a system font with mismatched weight.
2. **Proper directional stems on `▲` and `▼`.** The freshly-added triangles
   are bare equilateral shapes by themselves — they read as "triangles"
   more than "up arrow / down arrow." Flex fuses each one with the matching
   half-line glyph (`╷` U+2577 below `▲`, `╵` U+2575 above `▼`) so they read
   at a glance as proper directional arrows, and stack flush with adjacent
   `│` runs in the same column.
3. **Vertical-dash glyphs (`┆ ┊ ╎`) re-spaced for seamless tiling.** Stock
   Plex puts uneven gaps between dashes within a cell vs. between cells, so
   long vertical runs show a visible "extra gap" every cell boundary. Flex
   redraws each glyph with N evenly-spaced rectangles whose period divides
   the cell height exactly — vertical dashed lines now flow as a single
   continuous stroke across rows.

All three changes apply uniformly across **14 weights** (Thin → Bold,
upright + italic) and ship in **TTF**, **WOFF**, and **WOFF2**.

It's a font for documentation people who prefer Plex's humanist warmth
to JetBrains Mono's geometric crispness. We ship it as a sibling to
[BoxDraw Mono](https://boxdraw.ai) for that same crowd.

## Install

### Desktop (macOS / Linux / Windows)

Open the `ttf/` folder, select all 14 files, and double-click → "Install Font".
Or drop them in the OS-specific font directory:

| OS      | Path                                   |
|---------|----------------------------------------|
| macOS   | `~/Library/Fonts/`                     |
| Linux   | `~/.local/share/fonts/`                |
| Windows | `%LOCALAPPDATA%\Microsoft\Windows\Fonts\` |

After install, the family will appear in font pickers as **"BoxDraw Flex Mono"**.

### Web (CSS)

Drop the `woff2/` (or `woff/`) folder into your project's static assets.
Then in your CSS:

```css
@font-face {
  font-family: "BoxDraw Flex Mono";
  src: url("/fonts/BoxDrawFlexMono-Regular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "BoxDraw Flex Mono";
  src: url("/fonts/BoxDrawFlexMono-Bold.woff2") format("woff2");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
/* …repeat for the weights you want… */

code, pre {
  font-family: "BoxDraw Flex Mono", ui-monospace, monospace;
  /* ASCII art tiles seamlessly at this exact line-height: */
  line-height: 1.30;
}
```

WOFF2 is ~33% the size of TTF, so prefer it for the web. Use WOFF as a
fallback only if you support browsers older than 2017.

Note: BoxDraw Mono uses `line-height: 1.32` (JBM's natural line box) — Flex
uses `1.30` (Plex's natural line box). The 0.02 difference is real; if you
switch between the two fonts in the same view, retune line-height with the
font.

## License

**SIL Open Font License v1.1** — same as IBM Plex Mono, the upstream font.
See `OFL.txt` for the full text.

You can use BoxDraw Flex Mono for anything (personal, commercial, embedding
in documents, web pages, software). You can redistribute it. You can modify
it further. The only restrictions:

- Don't sell it on its own.
- Don't claim authorship.
- Any further modifications you redistribute must also be under OFL, and
  must be renamed (you can't ship modifications under "BoxDraw Flex Mono"
  either, and you must avoid the Reserved Font Name "Plex" from the
  upstream).

## Where it came from

Built for [boxdraw.ai](https://boxdraw.ai), a text-mode diagram tool that
renders ASCII art for AI agents to embed in documentation. Sibling project
to [BoxDraw Mono](https://boxdraw.ai); same renderer, different base font.

Original "IBM Plex Mono" Copyright © 2017 IBM Corp. with Reserved Font Name
"Plex", [github.com/IBM/plex](https://github.com/IBM/plex). The seven
transplanted Geometric Shapes glyphs are from "JetBrains Mono" Copyright
2020 The JetBrains Mono Project Authors,
[github.com/JetBrains/JetBrainsMono](https://github.com/JetBrains/JetBrainsMono),
also under OFL v1.1.
