# Drawing-algorithm command-count benchmark

A standalone, read-only analysis that compares candidate algorithms for turning an
image into skribbl.io draw commands. It does **not** modify the extension; it
exists to inform which algorithm to implement.

## Why

The current extension (`src/artist.js`) is a horizontal scan-line tracer that
emits one 2-point pen stroke per horizontal color-run per row — tens of thousands
of commands for a detailed image. This benchmark quantifies two things for each
candidate algorithm:

- **Cost** — total commands (pen strokes + fill clicks) and points/segments sent.
- **Progressive loading** — how quickly the image comes into "focus" as commands
  accrue (commands-to-X%-fidelity, plus snapshot PNGs at 10/25/50/100%).

## Algorithms compared

- **current** — scan-line runs, one 2-point stroke per run (the pre-polyline
  `src/artist.js`).
- **shipped** — faithful port of the *current* `src/artist.js` polyline chaining:
  same-color runs are chained into one stroke only when the next-row run has an
  end inside the current run's x-span, else the pen lifts. This is the real,
  achievable command count today.
- **polyline** — idealized one continuous snake stroke per connected color region
  (~1 command per region). The lower bound `shipped` is measured against.
- **bucket** — painter's layering: per region (biggest first) trace the outline,
  then flood-fill the interior (~2 commands per region).

## Pen-lift headroom & attribution

Two extra tables size the opportunity beyond what we ship:

- **Headroom** — `shipped` vs `polyline` (ideal). The gap is the most any
  region-chaining refinement could remove.
- **Attribution** (`penLiftAttribution`) partitions that gap by which fix would
  recover it: `terminal` (region genuinely ends — unavoidable, ≈ ideal count),
  `connector` (region continues with same color directly below but the connector
  rule is too strict on curved/widening edges — fixable pen-only via
  run-splitting, no overdraw/ordering), and `overdraw` (region wraps around a
  differently-colored hole — only the painter's/overdraw idea reconnects it).
  Across the corpus the gap is `connector`-dominated (70–100%), so the cheaper
  pen-only fix captures most of it; `overdraw` is the smaller 0–29% slice.

## Run

```sh
npm install --no-save pngjs jpeg-js   # color-diff is already a project dep
node analysis/command-count-benchmark.mjs            # repo + synthetic corpus
node analysis/command-count-benchmark.mjs a.png b.jpg # plus extra files
node analysis/algorithms.test.mjs                    # correctness fixtures
```

Drop your own PNG/JPEG examples into `analysis/images/` and they're picked up
automatically. Results print to stdout; fidelity curves (`*.csv`) and progressive
snapshots (`*-<pct>.png`) are written to `analysis/out/` (gitignored).

## In-game stroke-capture diagnostics

The benchmark models command counts; `src/diagnostics.js` measures the other half
empirically -- how skribbl actually captures synthesized multi-point strokes
(the polyline truncation bug). With the extension loaded, in a game where you're
the drawer (private room works), open DevTools (F12) and press **Ctrl+Shift+Y**.

The suite (~30s, clears the canvas repeatedly; keep the tab focused) draws a
20-row zigzag under each dispatch strategy and reads pixels back at per-row
probe points, so results are counted, not eyeballed:

- `baseline-2pt-strokes` — the pre-polyline behavior; control, expect 20/20.
- `burst-shipped` — all moves in one synchronous burst (the shipped polyline
  dispatch); reproduces the truncation.
- `burst-buttons1` — burst but with `buttons: 1`; isolates pointer-state vs timing.
- `raf-1` / `raf-1-buttons1` — one pointermove per animation frame.
- `raf-2/4/8/16/32` — k moves per frame: skribbl's points-per-frame budget.

Output goes to the page's DevTools console: per-scenario progress lines, a
`console.table` summary, and a single JSON blob (includes per-row hit bitmaps and
immediate-vs-settled counts to catch draw-then-cleared effects) to copy back for
analysis. Decision rule: if only `raf-1` variants reach 20/20, skribbl samples ~1
point per frame and the polyline can't beat per-run strokes on wall-clock (revert
is ready); if `raf-k` holds 20/20 for larger k, the polyline survives with paced
dispatch at k points per frame.

## Caveats

- Bucket fills are simulated as ideal/watertight; real flood fill can leak through
  gaps. The bucket "points" count traces every perimeter pixel and so overstates a
  real (simplified) pen outline's cost for large compact regions.
- The synthetic `gradient` uses random noise, so its counts vary slightly per run.
