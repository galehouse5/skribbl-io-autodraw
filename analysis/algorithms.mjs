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
