// Pure analysis of a quantized image (q = { width, height, idx: Int32Array of
// palette indices }). Produces, for each candidate drawing algorithm, an ordered
// list of "ops". An op is { commands, points, color, pixels } where `pixels` is
// an array of pixel indices the op paints to palette color `color`. Replaying the
// ops onto a buffer reproduces the image and lets us measure how fidelity grows
// with the number of commands (the progressive-loading property).

// --- Shared primitives ---------------------------------------------------

// Background = most common color by area. The extension picks most-common-by-run
// (src/artist.js getMostCommonColor); by-area is equivalent for the dominant flat
// color and is applied identically to every approach, so comparisons stay fair.
export function backgroundColor(q) {
    const counts = new Map();
    for (let p = 0; p < q.idx.length; p++) {
        counts.set(q.idx[p], (counts.get(q.idx[p]) || 0) + 1);
    }
    let best = 0, bestN = -1;
    for (const [c, n] of counts) if (n > bestN) { bestN = n; best = c; }
    return best;
}

// Horizontal run segments per row, mirroring extractLines in src/artist.js.
// Returns { runs: [{y, startX, endX, color, len}], count }.
export function horizontalRuns(q) {
    const runs = [];
    for (let y = 0; y < q.height; y++) {
        let startX = 0;
        let color = q.idx[y * q.width];
        for (let x = 1; x < q.width; x++) {
            const c = q.idx[y * q.width + x];
            if (c !== color) {
                runs.push({ y, startX, endX: x - 1, color, len: x - startX });
                startX = x;
                color = c;
            }
        }
        runs.push({ y, startX, endX: q.width - 1, color, len: q.width - startX });
    }
    return { runs, count: runs.length };
}

// 4-connected components of equal palette index. Returns regions with their pixel
// lists, perimeter pixel lists (any 4-neighbor differs or is out of bounds), and
// the number of horizontal run-segments they contain (a proxy for snake points).
export function connectedRegions(q) {
    const { width: W, height: H, idx } = q;
    const label = new Int32Array(W * H).fill(-1);
    const regions = [];
    const stack = [];

    for (let start = 0; start < idx.length; start++) {
        if (label[start] !== -1) continue;
        const color = idx[start];
        const id = regions.length;
        const pixels = [];
        const perimeter = [];
        label[start] = id;
        stack.push(start);

        while (stack.length) {
            const p = stack.pop();
            pixels.push(p);
            const x = p % W, y = (p / W) | 0;
            let isPerim = false;
            // neighbors: left, right, up, down
            const neigh = [
                x > 0 ? p - 1 : -1,
                x < W - 1 ? p + 1 : -1,
                y > 0 ? p - W : -1,
                y < H - 1 ? p + W : -1,
            ];
            for (const nb of neigh) {
                if (nb === -1 || idx[nb] !== color) { isPerim = true; continue; }
                if (label[nb] === -1) { label[nb] = id; stack.push(nb); }
            }
            if (isPerim) perimeter.push(p);
        }

        // count horizontal run-segments inside this region
        let segs = 0;
        // cheap approximation: scan region's pixels grouped by row
        pixels.sort((a, b) => a - b);
        let prev = -2, prevY = -1;
        for (const p of pixels) {
            const y = (p / W) | 0;
            if (y !== prevY || p !== prev + 1) segs++;
            prev = p; prevY = y;
        }

        regions.push({ id, color, pixels, perimeter, size: pixels.length, segs });
    }
    return regions;
}

// --- Op builders ---------------------------------------------------------

function fillOp(q, color) {
    const pixels = new Array(q.width * q.height);
    for (let p = 0; p < pixels.length; p++) pixels[p] = p;
    return { commands: 1, points: 1, color, pixels };
}

// Current extension: per-row run as a 2-point pen stroke, shuffled then sorted
// long-first; canvas pre-filled with the background color.
export function currentScanline(q) {
    const bg = backgroundColor(q);
    const { runs } = horizontalRuns(q);
    const drawn = runs.filter(r => r.color !== bg);
    // shuffle then stable-ish sort by length descending (matches src/artist.js)
    for (let i = drawn.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [drawn[i], drawn[j]] = [drawn[j], drawn[i]];
    }
    drawn.sort((a, b) => b.len - a.len);

    const ops = [fillOp(q, bg)];
    for (const r of drawn) {
        const pixels = [];
        for (let x = r.startX; x <= r.endX; x++) pixels.push(r.y * q.width + x);
        ops.push({ commands: 1, points: 2, color: r.color, pixels });
    }
    return ops;
}

// Polyline snake: one continuous stroke per connected region (background pre-fill
// still free). Big regions first for progressive coarse->fine loading.
export function polylineSnake(q, regions = connectedRegions(q)) {
    const bg = backgroundColor(q);
    const drawn = regions.filter(r => r.color !== bg).sort((a, b) => b.size - a.size);
    const ops = [fillOp(q, bg)];
    for (const r of drawn) {
        ops.push({ commands: 1, points: r.segs, color: r.color, pixels: r.pixels });
    }
    return ops;
}

// Faithful port of the SHIPPED src/artist.js buildPolylines chaining: vertically
// stacked same-color runs are chained into one stroke only when the next-row run
// has an end inside the current run's x-span (safe axis-aligned connector);
// otherwise the pen lifts. This is the real, achievable command count today -- the
// gap between this and the idealized polylineSnake (1 stroke/region) is the prize
// the overdraw/painter refinement could capture.
export function polylineShipped(q) {
    const W = q.width;
    const bg = backgroundColor(q);
    const { runs: allRuns } = horizontalRuns(q);

    const runs = allRuns
        .filter(r => r.color !== bg)
        .map(r => ({ y: r.y, startX: r.startX, endX: r.endX, color: r.color, used: false }));

    const byRow = new Map();
    for (const r of runs) {
        if (!byRow.has(r.y)) byRow.set(r.y, []);
        byRow.get(r.y).push(r);
    }
    for (const row of byRow.values()) row.sort((a, b) => a.startX - b.startX);
    runs.sort((a, b) => a.y - b.y || a.startX - b.startX);

    const ops = [fillOp(q, bg)];

    for (const start of runs) {
        if (start.used) continue;

        const pixels = [];
        let points = 2;
        const pushRun = r => { for (let x = r.startX; x <= r.endX; x++) pixels.push(r.y * W + x); };

        let cur = start;
        cur.used = true;
        pushRun(cur);
        let exitX = cur.endX;

        while (true) {
            const below = byRow.get(cur.y + 1);
            if (!below) break;
            let next = null, enterX = 0, bestDist = Infinity;
            for (const cand of below) {
                if (cand.used || cand.color !== cur.color) continue;
                for (const end of [cand.startX, cand.endX]) {
                    if (end < cur.startX || end > cur.endX) continue;
                    const dist = Math.abs(end - exitX);
                    if (dist < bestDist) { bestDist = dist; next = cand; enterX = end; }
                }
            }
            if (!next) break;
            const farX = enterX === next.startX ? next.endX : next.startX;
            points += 3;
            pushRun(next);
            next.used = true;
            cur = next;
            exitX = farX;
        }

        ops.push({ commands: 1, points, color: start.color, pixels });
    }

    // Big strokes first (matches src/artist.js polyline ordering).
    const head = ops.slice(0, 1);
    const body = ops.slice(1).sort((a, b) => b.pixels.length - a.pixels.length);
    return head.concat(body);
}

// Why does the shipped chaining lift the pen, and which fix would recover it?
// Re-run the exact chaining; at each chain-end decide whether the run's connected
// region actually CONTINUES below this row (region bottom row > current row):
//   terminal   - region ends here: unavoidable (~one per region, == the ideal).
//   connector  - region continues and the same color sits directly below in span,
//                but no run-end lands in span: the connector rule is too strict
//                (curved/widening edge). Recoverable by a pen-only smarter
//                connector (run-splitting) -- no overdraw, no layer ordering.
//   overdraw   - region continues but is blocked directly below by another color:
//                a true wrap-around hole. Only the overdraw/painter idea (draw
//                through it, let the covering region repaint it) reconnects this.
// terminal ~= ideal stroke count; connector+overdraw ~= the gap, partitioned by
// which refinement captures it.
export function penLiftAttribution(q, regions = connectedRegions(q)) {
    const W = q.width, H = q.height;
    const bg = backgroundColor(q);

    // region label + bottom-most row per pixel, for the "does it continue?" test.
    const label = new Int32Array(W * H);
    const maxRow = new Int32Array(regions.length);
    for (const r of regions) {
        for (const p of r.pixels) {
            label[p] = r.id;
            const y = (p / W) | 0;
            if (y > maxRow[r.id]) maxRow[r.id] = y;
        }
    }

    const { runs: allRuns } = horizontalRuns(q);
    const runs = allRuns
        .filter(r => r.color !== bg)
        .map(r => ({ y: r.y, startX: r.startX, endX: r.endX, color: r.color, used: false }));
    const byRow = new Map();
    for (const r of runs) { if (!byRow.has(r.y)) byRow.set(r.y, []); byRow.get(r.y).push(r); }
    for (const row of byRow.values()) row.sort((a, b) => a.startX - b.startX);
    runs.sort((a, b) => a.y - b.y || a.startX - b.startX);

    const tally = { terminal: 0, connector: 0, overdraw: 0, strokes: 0 };

    for (const start of runs) {
        if (start.used) continue;
        tally.strokes++;
        let cur = start;
        cur.used = true;
        let exitX = cur.endX;
        while (true) {
            const below = byRow.get(cur.y + 1);
            let next = null, enterX = 0, bestDist = Infinity;
            if (below) for (const cand of below) {
                if (cand.used || cand.color !== cur.color) continue;
                for (const end of [cand.startX, cand.endX]) {
                    if (end < cur.startX || end > cur.endX) continue;
                    const dist = Math.abs(end - exitX);
                    if (dist < bestDist) { bestDist = dist; next = cand; enterX = end; }
                }
            }
            if (next) {
                const farX = enterX === next.startX ? next.endX : next.startX;
                next.used = true; cur = next; exitX = farX;
                continue;
            }
            // chain ends: does the region continue below this row at all?
            const region = label[cur.y * W + cur.startX];
            if (cur.y >= maxRow[region]) { tally.terminal++; break; }
            // region continues lower: is the same color directly below in span?
            let same = false;
            if (cur.y + 1 < H) {
                for (let x = cur.startX; x <= cur.endX; x++) {
                    if (q.idx[(cur.y + 1) * W + x] === cur.color) { same = true; break; }
                }
            }
            if (same) tally.connector++; else tally.overdraw++;
            break;
        }
    }
    return tally;
}

// Painter's bucket layering: for each region (biggest first) trace its outline,
// then flood-fill its interior. Fidelity is split across the two ops so the curve
// reflects the within-region refinement.
export function bucketPainter(q, regions = connectedRegions(q)) {
    const bg = backgroundColor(q);
    const drawn = regions.filter(r => r.color !== bg).sort((a, b) => b.size - a.size);
    const ops = [fillOp(q, bg)];
    for (const r of drawn) {
        const perimSet = new Set(r.perimeter);
        const interior = r.pixels.filter(p => !perimSet.has(p));
        ops.push({ commands: 1, points: r.perimeter.length, color: r.color, pixels: r.perimeter });
        ops.push({ commands: 1, points: 1, color: r.color, pixels: interior });
    }
    return ops;
}

// --- Simulation ----------------------------------------------------------

// Replay ops, tracking fidelity (fraction of pixels matching the target) after
// each op, and snapshot the render buffer when cumulative commands cross the
// given fractions of the total. Fidelity bookkeeping is incremental (O(painted)).
export function simulate(ops, q, snapshotFractions = [0.1, 0.25, 0.5, 1.0]) {
    const P = q.width * q.height;
    const total = ops.reduce((s, o) => s + o.commands, 0);
    const thresholds = snapshotFractions.map(f => Math.max(1, Math.round(f * total)));
    const snapshots = [];

    const render = new Int32Array(P).fill(-1);
    let match = 0;
    let cmds = 0;
    const curve = [];
    let nextSnap = 0;

    for (const op of ops) {
        for (const p of op.pixels) {
            if (render[p] === q.idx[p]) match--;
            render[p] = op.color;
            if (op.color === q.idx[p]) match++;
        }
        cmds += op.commands;
        curve.push([cmds, match / P]);
        while (nextSnap < thresholds.length && cmds >= thresholds[nextSnap]) {
            snapshots.push({ fraction: snapshotFractions[nextSnap], commands: cmds, buffer: render.slice() });
            nextSnap++;
        }
    }
    while (snapshots.length < snapshotFractions.length) {
        snapshots.push({ fraction: snapshotFractions[snapshots.length], commands: cmds, buffer: render.slice() });
    }

    return { curve, snapshots, totalCommands: total, totalPoints: ops.reduce((s, o) => s + o.points, 0) };
}

// First command count at which fidelity reaches each threshold.
export function commandsToFidelity(curve, levels = [0.5, 0.9, 0.95, 0.99]) {
    const out = {};
    for (const lvl of levels) {
        const hit = curve.find(([, f]) => f >= lvl);
        out[lvl] = hit ? hit[0] : null;
    }
    return out;
}
