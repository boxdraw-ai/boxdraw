---
name: boxdraw
description: Render JSON diagrams to Unicode box-drawing ASCII via the boxdraw MCP server. Use this for ANY visualization the user requests — flowchart, sequence diagram, gantt chart, tree, table, bar chart, sparkline, sankey / flow breakdown, 2D system architecture, request/response flow, protocol bitfield, grid, or 2×2 quadrant. Do not hand-draw diagrams with freehand ASCII art; boxdraw output is correctly-aligned Unicode that survives markdown round-trips and LLM context. This skill includes the complete schema for every supported type — do not call diagram_help, author the JSON directly from the catalog below.
---

# boxdraw

The boxdraw MCP server renders JSON to Unicode box-drawing ASCII.
Thirteen diagram types are supported. Pick the right one, build the
JSON from the schema in this file, call `draw_diagram(diagram: <json>,
border?, width?)`, paste the ASCII output into your reply inside a
plain triple-backtick fence (no language tag).

## When to use this

You MUST use boxdraw — not hand-drawn ASCII — whenever the user asks
for any of:

- A diagram, chart, flowchart, sketch, or visualization
- A system architecture, request/response flow, sequence, or protocol
- A table that needs aligned columns and borders
- A tree, hierarchy, or nested-structure layout
- A bar chart, sparkline, gantt timeline, sankey/flow breakdown
- A bitfield, memory layout, or packed-byte protocol diagram
- A 2×2 priority/Eisenhower matrix or quadrant chart
- An N×M grid (chessboard, seating chart, memory page, etc.)

You MUST NOT compose box-drawing characters (`│ ─ ┌ ╭ ╮ ┐ └ ╰ ╯ ┘
├ ┤ ┬ ┴ ┼`) by hand. They will not align. Use the renderer.

You MUST call the MCP tool `draw_diagram` rather than emitting JSON
the user has to render themselves. The tool returns ASCII; paste the
ASCII inline.

## How to call the renderer

The MCP tool signature:

```
draw_diagram(
  diagram: <object — see "Diagram type catalog" below>,
  border?: "plain" | "rounded" (default) | "double" | "thick",
  width?:  integer
)
```

- `diagram` is the JSON for one diagram. The top-level object MUST
  have a `"type"` field naming one of the 13 types below; the rest of
  the shape is type-specific.
- `border` styles every bordered box in the diagram. Omit unless the
  user asks for a specific look.
- `width` is a hint, honored by `stack` and `bitfield`; other types
  auto-fit and ignore it.

After the call, paste the returned ASCII into your reply like this:

````
```
<ascii output verbatim>
```
````

## ALWAYS share the editor URL

Every `draw_diagram` call mints a URL the user can open in the
browser to tweak the diagram by hand. The tool's `content[0].text`
already includes the URL on its own line — for example:

```
<ascii body>
Open in editor: https://boxdraw.ai/editor/uh7yGj8Lp
```

You MUST paste the URL line through verbatim. Do NOT strip it. Do
NOT replace it with prose ("you can edit this online"). The URL
itself is the affordance; the user clicks it.

The URL is also available structurally in `_meta.url` if you'd
rather construct your own surrounding text — but the line in
`content[0].text` is already formatted for direct paste, so just
keep it.

## After the user edits — `fetch_diagram(id)`

When the user references a boxdraw editor URL ("I edited it",
"look at this link", "fetch the latest version", or just pastes
the URL), you MUST call `fetch_diagram(id)` BEFORE you respond.

- Extract the `id` from the URL — it's the trailing path segment,
  always exactly 12 URL-safe characters (`A-Z a-z 0-9 _ -`).
  Example: in `https://boxdraw.ai/editor/uh7yGj8Lp`, the id is
  `uh7yGj8Lp`.
- Call `fetch_diagram({ id: "uh7yGj8Lp" })`.
- The tool returns the live JSON plus a freshly-rendered ASCII.
  Paste the ASCII into your reply (same fence convention as
  `draw_diagram`), describe whatever changed since your last
  output, then continue the conversation about that diagram.

You MUST NOT assume the stored diagram matches your previous
`draw_diagram` output. The user may have moved nodes, renamed
boxes, added clusters, deleted edges. Always fetch fresh.

You MUST NOT call `fetch_diagram` with anything other than a real
12-char id. Don't guess one. Don't construct one. If the URL the
user shared doesn't have a valid id segment, ask for clarification.

No language tag inside the fence. Do not modify the ASCII. Do not
wrap it in any other prose markup.

## Diagram type catalog

| type     | what it draws                                                          |
|----------|------------------------------------------------------------------------|
| stack    | vertically stacked labels with optional notes                          |
| bitfield | a packed-bits diagram (e.g. an IPv4 header) with bit-width annotations |
| table    | a bordered table with headers, alignment, and rows                     |
| tree     | a tree of labels (root + nested children)                              |
| steps    | a vertical numbered list of steps (with optional notes)                |
| grid     | an N×M grid of identical cells (e.g. a chessboard or memory page)      |
| sequence | a UML-style sequence diagram with participants, lifelines, messages    |
| bar      | a horizontal bar chart                                                 |
| graph    | 2D-positioned boxes with auto-routed edges (A* path planning)          |
| spark    | a sparkline (single-line histogram)                                    |
| quadrant | a 2×2 matrix with axis labels and bullet items per quadrant            |
| gantt    | a Gantt chart with tasks, progress bars, and milestones                |
| sankey   | a flow breakdown — columns of stacked boxes sized by value             |

Every top-level diagram object MUST include `"type": "<one of above>"`.
Most types also accept an optional `"title": "<string>"` field that
renders centered above the diagram.

## Picking the right type

Match the user's intent to a type. When in doubt, default to `graph`
— it is the most flexible.

| The user wants…                                       | Use      |
|-------------------------------------------------------|----------|
| A pipeline, system topology, or service map           | graph    |
| A request/response between named actors over time     | sequence |
| A linear procedure with numbered steps                | steps    |
| Vertically stacked layers / a "what's in this stack"  | stack    |
| A hierarchy or tree of labels                         | tree     |
| Tabular data with column alignment                    | table    |
| A protocol header or memory layout (bit widths)       | bitfield |
| An N×M grid of identical cells (board, memory page)   | grid     |
| A horizontal bar chart of named values                | bar      |
| A trend line you can read at a glance                 | spark    |
| A 2×2 priority / Eisenhower / impact-effort matrix    | quadrant |
| A project timeline with start/end/progress            | gantt    |
| Where revenue / users / requests / dollars FLOW       | sankey   |

If `sequence` and `steps` both seem plausible, choose `sequence` when
there are NAMED actors exchanging messages; choose `steps` when it is
a single linear list of actions.

## Schemas

The full JSON shape for every type is below. Read the relevant section
before authoring the JSON for a `draw_diagram` call.

---

### stack — labelled items in a vertical pile

Required:
```
type:   "stack"
items:  [ { label: string, note?: string }, ... ]
```

Optional:
```
title:  string
```

Example:

```json
{
  "type": "stack",
  "title": "Boot sequence",
  "items": [
    {"label": "BIOS"},
    {"label": "Bootloader", "note": "GRUB"},
    {"label": "Kernel"}
  ]
}
```

---

### bitfield — packed-bits diagram (e.g. protocol headers)

Required:
```
type:    "bitfield"
fields:  [ { name: string, bits: number }, ... ]
```

Optional:
```
title:   string
```

Example:

```json
{
  "type": "bitfield",
  "title": "IPv4 header (first 32 bits)",
  "fields": [
    {"name": "Version", "bits": 4},
    {"name": "IHL", "bits": 4},
    {"name": "TOS", "bits": 8},
    {"name": "Total Length", "bits": 16}
  ]
}
```

---

### table — bordered table with headers, rows, and alignment

Required:
```
type:     "table"
columns:  string[]              (header labels)
rows:     string[][]            (each inner array is one row)
```

Optional:
```
title:    string
align:    ("left"|"center"|"right")[]   (one per column; default left)
```

Example:

```json
{
  "type": "table",
  "columns": ["Name", "Score"],
  "align":   ["left", "right"],
  "rows":    [["Alice", "98"], ["Bob", "73"]]
}
```

---

### tree — labelled tree (root + nested children)

Required:
```
type:   "tree"
root:   string
```

Optional:
```
title:    string
children: TreeNode[]
  where TreeNode = { label: string, children?: TreeNode[] }
```

Example:

```json
{
  "type": "tree",
  "root": "/",
  "children": [
    {"label": "etc", "children": [{"label": "passwd"}]},
    {"label": "home", "children": [{"label": "adam"}, {"label": "guest"}]}
  ]
}
```

---

### steps — numbered list of steps with optional notes

A vertical stack of numbered boxes. Use this for a procedure, a
checklist, or any ordered series of actions where you do NOT need
to show interactions between actors. (For request/response between
actors with lifelines and arrows, use `sequence` instead.)

Required:
```
type:   "steps"
items:  [ { label: string, note?: string, below?: string }, ... ]
```

Optional:
```
title:  string
```

Example:

```json
{
  "type": "steps",
  "items": [
    {"label": "Send SYN"},
    {"label": "Receive SYN+ACK", "note": "wait up to 3s"},
    {"label": "Send ACK"}
  ]
}
```

---

### grid — N×M grid of identical cells

Required:
```
type:    "grid"
cell:    string         (the character/string drawn in each cell)
rows:    number
cols:    number
```

Optional:
```
title:      string
show_rows:  number      (cap rendered rows for big grids)
show_cols:  number      (cap rendered cols)
row_label:  string      (label printed alongside the row axis)
col_label:  string      (label printed alongside the col axis)
note:       string
```

Example:

```json
{"type": "grid", "cell": "·", "rows": 8, "cols": 8, "title": "Chessboard"}
```

---

### sequence — UML-style sequence diagram

The classic sequence diagram with vertical lifelines for each
participant and horizontal arrows for messages between them. Use
this for request/response flows, RPC walkthroughs, protocol
exchanges, or any interaction between named actors. (For a flat
numbered list of steps without lifelines, use `steps` instead.)

Required:
```
type:          "sequence"
participants:  string[]
messages:      [ { from: <participant>, to: <participant>, label: string,
                   note?: string[] } ]
```

Optional:
```
title:  string
```

Example:

```json
{
  "type": "sequence",
  "title": "Login flow",
  "participants": ["Browser", "Server", "DB"],
  "messages": [
    {"from": "Browser", "to": "Server", "label": "POST /login"},
    {"from": "Server", "to": "DB", "label": "lookup user"},
    {"from": "DB", "to": "Server", "label": "user row"},
    {"from": "Server", "to": "Browser", "label": "set cookie"}
  ]
}
```

---

### bar — horizontal bar chart

Required:
```
type:  "bar"
bars:  [ { label: string, value: number, display?: string }, ... ]
```

Optional:
```
title:        string
max:          number      (override auto-detected max)
bar_width:    number      (max width in cells)
axis_labels:  string[]    (extra labels printed below the bars)
```

Example:

```json
{
  "type": "bar",
  "title": "Q4 revenue",
  "bars": [
    {"label": "Oct", "value": 120},
    {"label": "Nov", "value": 145},
    {"label": "Dec", "value": 198, "display": "$198k"}
  ]
}
```

---

### graph — 2D boxes with auto-routed edges (A* path planning)

The most flexible type. Boxes go on a 2D grid; edges are routed
automatically to avoid overlapping with boxes and (where possible)
each other.

Required:
```
type:   "graph"
boxes:  { <id>: { label: string, notes?: string[],
                  shape?: "box" (default) | "sketch" | "cylinder" | "decision" | "note",
                  border?: "rounded" | "square" | "bold" } }
nodes:  [ { id: <box-id>, at: [col, row] } ]   (zero-indexed)
```

Optional:
```
title:    string
edges:    [ { from: <node-id>, to: <node-id>, label?: string,
              from_side?: "n"|"s"|"e"|"w",
              to_side?:   "n"|"s"|"e"|"w",
              arrow_from?: bool (default false),
              arrow_to?:   bool (default true),
              wire?:       "thin" | "thick" } ]
clusters: [ { label: string, members: [<node-id>],
              label_side?: "north" (default) | "south",
              label_align?: "left" | "center" (default) | "right",
              border?:      "dotted" | "thin" | "bold" } ]
```

Example:

```json
{
  "type": "graph",
  "boxes": {
    "a": {"label": "Client"},
    "b": {"label": "API"},
    "c": {"label": "DB", "shape": "cylinder"}
  },
  "nodes": [
    {"id": "a", "at": [0, 0]},
    {"id": "b", "at": [1, 0]},
    {"id": "c", "at": [2, 0]}
  ],
  "edges": [
    {"from": "a", "to": "b", "label": "GET /x"},
    {"from": "b", "to": "c", "label": "SELECT"}
  ]
}
```

Side hints (from_side / to_side) are usually unnecessary — the router
picks reasonable sides based on relative positions. Use them when
you want a specific shape (e.g. force an edge to leave the south of
its source, even if the destination is east).

---

### spark — sparkline (single-line histogram of values)

Required:
```
type:    "spark"
values:  number[]
```

Optional:
```
title:    string
label:    string    (printed before the sparkline)
display:  string    (printed after the sparkline)
```

Example:

```json
{
  "type": "spark",
  "label": "CPU",
  "values": [12, 18, 24, 30, 28, 22, 16, 12, 10],
  "display": "10–30%"
}
```

---

### quadrant — 2×2 matrix with axis labels and bullet items

Required:
```
type:    "quadrant"
x_axis:  { low: string, high: string }
y_axis:  { low: string, high: string }
```

Optional:
```
title:  string
tl, tr, bl, br:  string[]   (bullet items in each quadrant)
```

Example:

```json
{
  "type": "quadrant",
  "title": "Eisenhower matrix",
  "x_axis": {"low": "Less urgent",  "high": "More urgent"},
  "y_axis": {"low": "Less important","high": "More important"},
  "tl": ["Schedule strategy off-site"],
  "tr": ["Fix prod outage"],
  "bl": ["Sort emails"],
  "br": ["Reply to that one customer"]
}
```

---

### gantt — Gantt chart with tasks, progress bars, and milestones

Required:
```
type:    "gantt"
tasks:   [ { name: string, start: number, end: number,
             progress?: 0..1, milestone?: bool } ]
```

Optional:
```
title:        string
max:          number
bar_width:    number
axis_labels:  string[]
```

`progress: 0.0` means not started, `1.0` means done; the bar is drawn
with a solid portion proportional to progress, hollow portion for the
remainder. `milestone: true` collapses the task to a single diamond
marker (start/end can be the same value).

Example:

```json
{
  "type": "gantt",
  "title": "Sprint plan",
  "tasks": [
    {"name": "Design",  "start": 0, "end": 3, "progress": 1.0},
    {"name": "Build",   "start": 2, "end": 7, "progress": 0.4},
    {"name": "Ship!",   "start": 7, "end": 7, "milestone": true}
  ]
}
```

---

### sankey — flow breakdown across stages

Rectilinear, box-drawing-honest cousin of a real Sankey. Each stage
is a column of stacked rounded boxes; each box's height is proportional
to its `value`. A single `→` glyph sits between columns as a flow-
direction hint — no curved bands. Alignment between columns is the
flow.

Required:
```
type:    "sankey"
stages:  [ { label?: string, items: [ { label, value, display? }, ... ] }, ... ]
```

Optional:
```
title:   string
height:  number  // target rows for the largest column; default 20
```

Per item:
```
label:   string  — the line shown on row 1 of the box
value:   number  — drives box height (proportional to this)
display: string  — optional pre-formatted value (e.g. "$316.2B");
                   defaults to the raw number
```

Notes:
- Every box is at least 4 rows so the value fits below the label.
  Small flows get visually inflated as a result — sankey here is
  about gist, not millimetre accuracy.
- Per-stage `items.value` totals are expected to be roughly equal
  (it's a flow). They do not have to be; columns are top-aligned
  and shorter columns just have whitespace below.
- `stages[*].label` renders above each column.

Example:

```json
{
  "type": "sankey",
  "title": "FY24 Revenue Breakdown",
  "height": 24,
  "stages": [
    {
      "label": "Sources",
      "items": [
        {"label": "iPhone",   "value": 205.5, "display": "$205.5B"},
        {"label": "Services", "value": 78.2,  "display": "$78.2B"}
      ]
    },
    {
      "label": "Total",
      "items": [
        {"label": "Revenue", "value": 283.7, "display": "$283.7B"}
      ]
    },
    {
      "label": "Split",
      "items": [
        {"label": "Profit", "value": 100.0, "display": "$100B"},
        {"label": "Cost",   "value": 183.7, "display": "$183.7B"}
      ]
    }
  ]
}
```

## Common pitfalls — do not make these mistakes

- **Do NOT hand-author ASCII art.** Always call `draw_diagram`. Box-
  drawing chars composed by hand will not align across rows and will
  break the moment the prose around them changes width.
- **Do NOT call `diagram_help` first.** This skill already contains
  every type's schema. Skipping the help call saves a round-trip.
- **Do NOT wrap the returned ASCII in a language fence.** Use a plain
  triple-backtick fence with no language tag. A language tag (e.g.
  ` ```text`) makes some renderers reflow whitespace or apply a font
  that breaks alignment.
- **Do NOT modify the returned ASCII before pasting.** Trimming
  trailing whitespace, re-indenting, or collapsing blank lines will
  shift columns by one cell and break the diagram.
- **Type confusion: `sequence` vs `steps`.** Use `sequence` when there
  are NAMED actors exchanging messages (lifelines + arrows). Use
  `steps` for a single linear list of actions with no inter-actor
  arrows.
- **Type confusion: `bar` vs `spark`.** Use `bar` when each value is
  named and comparison BETWEEN values is the point. Use `spark` when
  the SHAPE of a series (going up / down / bouncing) is the message.
- **Type confusion: `graph` vs `tree`.** Use `tree` for strict
  hierarchies (parent → children, no cycles). Use `graph` for
  anything with multiple incoming edges, cycles, or 2D positioning.
- **`graph` node positions are zero-indexed grid cells, not pixels.**
  `at: [0, 0]` is the top-left; `at: [3, 1]` is column 3, row 1.
  The renderer sizes each column to fit its widest box.
