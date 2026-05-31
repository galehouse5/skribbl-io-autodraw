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

- **current** — scan-line runs, background pre-filled, shuffled then long-first
  (mirrors `src/artist.js`).
- **polyline** — one continuous snake stroke per connected color region, biggest
  region first (~1 command per region).
- **bucket** — painter's layering: per region (biggest first) trace the outline,
  then flood-fill the interior (~2 commands per region).

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

## Caveats

- Bucket fills are simulated as ideal/watertight; real flood fill can leak through
  gaps. The bucket "points" count traces every perimeter pixel and so overstates a
  real (simplified) pen outline's cost for large compact regions.
- The synthetic `gradient` uses random noise, so its counts vary slightly per run.
