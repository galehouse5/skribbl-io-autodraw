// Pure stroke planning for multi-width, multi-direction pen drawing. No DOM, no
// imports -- node-testable directly (see analysis/stroke-planner.test.mjs).
//
// Cost model (measured via src/diagnostics.js): skribbl samples pointer input at
// ~60Hz and a 2-point stroke costs one ~16ms slot REGARDLESS of length or pen
// size. So the objective is simply the fewest strokes, each covering as many
// pixels as possible: fat pens for region interiors, long thin strokes hugging
// edges at whatever angle the edge runs, dots as a last resort.
//
// Round caps: a skribbl stroke covers the Minkowski sum of its segment with the
// round brush -- a capsule extending ~radius px past each endpoint. Coarse-pen
// centerlines are restricted to pixels whose distance to any other color (or the
// image border) is at least radius + MARGIN_IN, so the whole capsule, caps
// included, provably stays inside the color region. The brush's exact footprint
// isn't known, so margins are conservative both ways: erode by MARGIN_IN extra,
// credit coverage with MARGIN_OUT less. The smallest (edge) pen instead gets the
// historical slop rule -- centerline on any pixel of its color -- because edge
// pixels are unreachable under strict margins; its sub-pixel overshoot matches
// what the extension has always done.

const MARGIN_IN = 1.0;   // extra erosion (image px): cap slop + sample rounding
const MARGIN_OUT = 0.35; // understamp so we never credit pixels the pen may miss
const DIRECTIONS = 12;   // candidate stroke angles in [0, pi)

// Two-tier coverage credit, reflecting that the brush's exact footprint is
// unknown. Solid tier: pixels certainly painted (the 0.72 floor comes from the
// one empirical datum we have -- realPenDiameter 2.9 vs nominal 4 -- i.e. solid
// coverage ~0.72x nominal). Likely tier: pixels the nominal footprint paints.
// Solid drives the coverage guarantee; likely only excuses crumb-yield seeds,
// so we never spend a whole stroke repainting a fringe pixel the pen almost
// certainly already hit.
const solidRadius = r => Math.max(r - MARGIN_OUT, r * 0.72);
const likelyRadius = r => r + 0.25;

// --- exact squared Euclidean distance transform ----------------------------

// 1D lower envelope (Felzenszwalb & Huttenlocher). f holds squared distances.
const dt1d = function (f) {
    const n = f.length;
    const d = new Float64Array(n);
    const v = new Int32Array(n);
    const z = new Float64Array(n + 1);
    let k = 0;
    v[0] = 0;
    z[0] = -1e20;
    z[1] = 1e20;
    for (let q = 1; q < n; q++) {
        let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
        while (s <= z[k]) {
            k--;
            s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
        }
        k++;
        v[k] = q;
        z[k] = s;
        z[k + 1] = 1e20;
    }
    k = 0;
    for (let q = 0; q < n; q++) {
        while (z[k + 1] < q) k++;
        d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
    }
    return d;
};

// Squared distance from each pixel to the nearest pixel that is NOT `color`.
// The image border counts as not-color (painting past it would hit the
// background fill around the centered image).
export const squaredDistanceToOther = function (width, height, idx, color) {
    const INF = 1e10; // finite so the parabola arithmetic stays NaN-free
    const g = new Float64Array(width * height);
    for (let p = 0; p < g.length; p++) g[p] = idx[p] === color ? INF : 0;

    const col = new Float64Array(height);
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) col[y] = g[y * width + x];
        const d = dt1d(col);
        for (let y = 0; y < height; y++) g[y * width + x] = d[y];
    }

    const row = new Float64Array(width);
    const out = new Float64Array(width * height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) row[x] = g[y * width + x];
        const d = dt1d(row);
        for (let x = 0; x < width; x++) {
            const bx = Math.min(x + 1, width - x);
            const by = Math.min(y + 1, height - y);
            out[y * width + x] = Math.min(d[x], bx * bx, by * by);
        }
    }
    return out;
};

// --- capsule geometry -------------------------------------------------------

const pointSegDist2 = function (px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const ex = x1 + t * dx - px, ey = y1 + t * dy - py;
    return ex * ex + ey * ey;
};

// Visit every pixel within r of the segment.
const capsuleWalk = function (width, height, s, r, visit) {
    const ri = Math.ceil(r);
    const r2 = r * r;
    const xa = Math.max(0, Math.min(s.x1, s.x2) - ri);
    const xb = Math.min(width - 1, Math.max(s.x1, s.x2) + ri);
    const ya = Math.max(0, Math.min(s.y1, s.y2) - ri);
    const yb = Math.min(height - 1, Math.max(s.y1, s.y2) + ri);
    for (let y = ya; y <= yb; y++) {
        for (let x = xa; x <= xb; x++) {
            if (pointSegDist2(x, y, s.x1, s.y1, s.x2, s.y2) <= r2) visit(y * width + x);
        }
    }
};

// --- planner -----------------------------------------------------------------

// idx: Int32Array of palette indices. pens: [{ diameter, radiusImg, edge }]
// sorted largest first, radiusImg in image px, edge=true for the detail pen.
// Returns 2-point strokes { color, diameter, x1, y1, x2, y2, covers } such that
// replaying them (after a background fill) reproduces every non-background pixel.
export const planStrokes = function ({ width, height, idx, background, pens }) {
    const covered = new Uint8Array(width * height);
    const likely = new Uint8Array(width * height);
    for (let p = 0; p < idx.length; p++) if (idx[p] === background) covered[p] = 1;

    const dirs = [];
    for (let i = 0; i < DIRECTIONS; i++) {
        const a = Math.PI * i / DIRECTIONS;
        dirs.push({ ux: Math.cos(a), uy: Math.sin(a) });
    }

    const penParams = pens.map(function (pen) {
        const rIn = pen.edge ? 1 : pen.radiusImg + MARGIN_IN;
        const rCov = solidRadius(pen.radiusImg);
        return {
            diameter: pen.diameter, rIn2: rIn * rIn, rCov,
            rLikely: likelyRadius(pen.radiusImg), reach: Math.floor(rCov),
            // Fat pens fill interiors where 4 angles suffice; only the edge pen
            // needs fine angular resolution to hug curved boundaries.
            dirs: pen.edge ? dirs : dirs.filter((d, i) => i % 3 === 0)
        };
    });

    const distByColor = new Map();
    const distFor = function (color) {
        if (!distByColor.has(color)) {
            distByColor.set(color, squaredDistanceToOther(width, height, idx, color));
        }
        return distByColor.get(color);
    };

    // Longest run of erosion-safe pixels through (cx, cy) along direction d.
    const extend = function (dist, rIn2, cx, cy, d) {
        const walk = function (sx, sy) {
            let last = { x: cx, y: cy };
            for (let k = 1; k < 1000; k++) {
                const x = Math.round(cx + sx * k), y = Math.round(cy + sy * k);
                if (x < 0 || x >= width || y < 0 || y >= height) break;
                if (dist[y * width + x] < rIn2) break;
                last = { x, y };
            }
            return last;
        };
        const a = walk(d.ux, d.uy), b = walk(-d.ux, -d.uy);
        return { x1: b.x, y1: b.y, x2: a.x, y2: a.y, len: Math.hypot(a.x - b.x, a.y - b.y) };
    };

    // Hot path: called for every candidate of every seed evaluation, so it
    // inlines the capsule walk rather than paying a closure call per pixel.
    const countNewlyCovered = function (seg, pen, color) {
        const r = pen.rCov, r2 = r * r, ri = Math.ceil(r);
        const xa = Math.max(0, Math.min(seg.x1, seg.x2) - ri);
        const xb = Math.min(width - 1, Math.max(seg.x1, seg.x2) + ri);
        const ya = Math.max(0, Math.min(seg.y1, seg.y2) - ri);
        const yb = Math.min(height - 1, Math.max(seg.y1, seg.y2) + ri);
        const ux = seg.x2 - seg.x1, uy = seg.y2 - seg.y1;
        const len2 = ux * ux + uy * uy;
        let covers = 0;
        for (let y = ya; y <= yb; y++) {
            const rowBase = y * width;
            for (let x = xa; x <= xb; x++) {
                const p = rowBase + x;
                if (covered[p] || idx[p] !== color) continue;
                let t = len2 === 0 ? 0 : ((x - seg.x1) * ux + (y - seg.y1) * uy) / len2;
                t = t < 0 ? 0 : t > 1 ? 1 : t;
                const ex = seg.x1 + t * ux - x, ey = seg.y1 + t * uy - y;
                if (ex * ex + ey * ey <= r2) covers++;
            }
        }
        return covers;
    };

    // Shrink edge-pen chords whose ends run through already-covered pixels
    // (rim seeds otherwise produce canvas-spanning chords whose capsule walks
    // dominate planning time). The slight cap-reach loss is recounted, so
    // credit stays consistent with the trimmed stroke.
    const trimCoveredEnds = function (seg, color) {
        const points = [];
        const steps = Math.max(1, Math.round(Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1)));
        for (let k = 0; k <= steps; k++) {
            const x = Math.round(seg.x1 + (seg.x2 - seg.x1) * k / steps);
            const y = Math.round(seg.y1 + (seg.y2 - seg.y1) * k / steps);
            points.push({ x, y, p: y * width + x });
        }
        let a = 0, b = points.length - 1;
        while (a < b && (covered[points[a].p] || idx[points[a].p] !== color)) a++;
        while (b > a && (covered[points[b].p] || idx[points[b].p] !== color)) b--;
        return {
            x1: points[a].x, y1: points[a].y, x2: points[b].x, y2: points[b].y,
            len: Math.hypot(points[b].x - points[a].x, points[b].y - points[a].y)
        };
    };

    // Best stroke for this pen whose capsule covers (px, py). The centerline may
    // sit up to `reach` px to either side of the pixel (perpendicular offset);
    // the side toward unscanned rows is preferred so strokes reach forward, like
    // greedy interval covering. Direction is chosen by actual newly-covered
    // count: stroke length is free under the cost model, and the longest
    // extension is often a chord through already-covered interior while a short
    // tangential stroke hugging an edge covers far more.
    //
    // If no candidate can possibly reach `threshold` (by capsule-area bound),
    // returns the bound as an inexact score instead of paying for exact counts.
    const findBest = function (px, py, color, dist, threshold) {
        const candidates = [];
        let bound = 0;
        for (const pen of penParams) {
            for (const d of pen.dirs) {
                let nx = -d.uy, ny = d.ux;
                if (ny < 0) { nx = -nx; ny = -ny; }
                for (let t = pen.reach; t >= -pen.reach; t--) {
                    const cx = Math.round(px + nx * t), cy = Math.round(py + ny * t);
                    if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;
                    if (dist[cy * width + cx] < pen.rIn2) continue;
                    let seg = extend(dist, pen.rIn2, cx, cy, d);
                    if (pen === penParams[penParams.length - 1]) seg = trimCoveredEnds(seg, color);
                    candidates.push({ seg, pen });
                    bound = Math.max(bound,
                        2 * pen.rCov * seg.len + Math.PI * pen.rCov * pen.rCov);
                    break; // deepest valid offset for this direction
                }
            }
        }
        if (bound < threshold) return { covers: bound, exact: false };

        let best = null, bestPen = null, bestCovers = 0;
        for (const { seg, pen } of candidates) {
            const covers = countNewlyCovered(seg, pen, color);
            if (covers > bestCovers) { best = seg; bestPen = pen; bestCovers = covers; }
        }
        return { seg: best, pen: bestPen, covers: bestCovers, exact: true };
    };

    const strokes = [];

    const emit = function (seg, pen, color, covers) {
        strokes.push({
            color, diameter: pen.diameter,
            x1: seg.x1, y1: seg.y1, x2: seg.x2, y2: seg.y2, covers
        });
        // Only own-color pixels in either tier: edge-pen slop onto a neighbor
        // must not excuse the neighbor from painting that pixel its real color.
        capsuleWalk(width, height, seg, pen.rCov, function (p) {
            if (idx[p] === color) covered[p] = 1;
        });
        capsuleWalk(width, height, seg, pen.rLikely, function (p) {
            if (idx[p] === color) likely[p] = 1;
        });
    };

    // Declining-threshold sweeps approximate a globally greedy order: a stroke
    // is only emitted once nothing much better could cover its seed pixel.
    // Strict raster-order emission would force a poor stroke at every region's
    // top rim before fat pens ever saw the interior. lastScore caches each
    // seed's most recent (upper-bound) score; coverage only grows, so scores
    // only shrink, and a seed below the threshold can be skipped without
    // re-evaluation (lazy greedy).
    const lastScore = new Float64Array(width * height).fill(Infinity);

    for (let threshold = 4096; threshold >= 1; threshold = Math.floor(threshold / 2)) {
        for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
                const p = py * width + px;
                if (covered[p]) continue;
                const color = idx[p];

                if (lastScore[p] >= threshold) {
                    const best = findBest(px, py, color, distFor(color), threshold);
                    lastScore[p] = best.covers;

                    // Crumb-yield seeds the nominal footprint already painted
                    // aren't worth a whole 16ms stroke.
                    if (best.covers <= 2 && likely[p]) continue;
                    if (best.exact && best.covers >= threshold) {
                        emit(best.seg, best.pen, color, best.covers);
                    }
                }

                if (threshold === 1 && !covered[p] && !likely[p]) {
                    // Centerline rounding can leave the seed pixel just outside
                    // every stamped capsule; a dot guarantees coverage.
                    const edge = penParams[penParams.length - 1];
                    emit({ x1: px, y1: py, x2: px, y2: py, len: 0 }, edge, color, 1);
                }
            }
        }
    }

    return { strokes, covered, likely };
};
