// Correctness fixtures for the multi-width stroke planner.
//   node analysis/stroke-planner.test.mjs
import assert from "assert";
import { squaredDistanceToOther, planStrokes } from "../src/stroke-planner.mjs";

// --- exact EDT vs brute force on a random grid -----------------------------

const rnd = (function () {
    let seed = 1234;
    return () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
})();

{
    const W = 24, H = 18;
    const idx = Int32Array.from({ length: W * H }, () => (rnd() * 3) | 0);
    for (const color of [0, 1, 2]) {
        const dist = squaredDistanceToOther(W, H, idx, color);
        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                let best = Math.min(
                    (x + 1) ** 2, (W - x) ** 2, (y + 1) ** 2, (H - y) ** 2);
                for (let yy = 0; yy < H; yy++) {
                    for (let xx = 0; xx < W; xx++) {
                        if (idx[yy * W + xx] === color) continue;
                        best = Math.min(best, (xx - x) ** 2 + (yy - y) ** 2);
                    }
                }
                assert.strictEqual(dist[y * W + x], best,
                    `EDT mismatch at (${x},${y}) color ${color}`);
            }
        }
    }
}

// --- planner safety + coverage on synthetic shapes --------------------------

const REAL_PEN = 2.9;
const pens = [40, 20, 10, 4].map(d => ({
    diameter: d, radiusImg: d / REAL_PEN / 2, edge: d === 4
}));
const radiusByDiameter = new Map(pens.map(p => [p.diameter, p.radiusImg]));

// Round-cap containment for coarse pens: stamp each stroke with the pen's REAL
// radius (the erosion margin leaves >=0.25 px headroom beyond rounding error)
// and assert every touched pixel is the stroke's color. The edge pen instead
// keeps the historical sub-pixel slop, so for it we only assert the centerline
// endpoints sit on own-color pixels.
const assertStrokesSafe = function (name, q, strokes) {
    for (const s of strokes) {
        if (s.diameter === 4) {
            assert.strictEqual(q.idx[s.y1 * q.width + s.x1], s.color,
                `${name}: edge stroke endpoint off-color at (${s.x1},${s.y1})`);
            assert.strictEqual(q.idx[s.y2 * q.width + s.x2], s.color,
                `${name}: edge stroke endpoint off-color at (${s.x2},${s.y2})`);
            continue;
        }
        const r = radiusByDiameter.get(s.diameter) + 0.25;
        const ri = Math.ceil(r);
        for (let y = Math.max(0, Math.min(s.y1, s.y2) - ri);
            y <= Math.min(q.height - 1, Math.max(s.y1, s.y2) + ri); y++) {
            for (let x = Math.max(0, Math.min(s.x1, s.x2) - ri);
                x <= Math.min(q.width - 1, Math.max(s.x1, s.x2) + ri); x++) {
                const dx = x, dy = y;
                const d2 = (function () {
                    const ux = s.x2 - s.x1, uy = s.y2 - s.y1;
                    const len2 = ux * ux + uy * uy;
                    let t = len2 === 0 ? 0 : ((dx - s.x1) * ux + (dy - s.y1) * uy) / len2;
                    t = Math.max(0, Math.min(1, t));
                    return (s.x1 + t * ux - dx) ** 2 + (s.y1 + t * uy - dy) ** 2;
                })();
                if (d2 > r * r) continue;
                assert.strictEqual(q.idx[y * q.width + x], s.color,
                    `${name}: pen ${s.diameter} stroke spills onto wrong color at (${x},${y})`);
            }
        }
    }
};

// The planner's guarantee: every non-background pixel solidly covered, or at
// minimum inside some stroke's nominal (likely) footprint.
const assertFullCoverage = function (name, q, covered, likely) {
    for (let p = 0; p < q.idx.length; p++) {
        if (q.idx[p] === q.background) continue;
        assert.ok(covered[p] || likely[p],
            `${name}: pixel (${p % q.width},${(p / q.width) | 0}) left uncovered`);
    }
};

const baselineRunCount = function (q) {
    let runs = 0;
    for (let y = 0; y < q.height; y++) {
        let x = 0;
        while (x < q.width) {
            const color = q.idx[y * q.width + x];
            let end = x;
            while (end + 1 < q.width && q.idx[y * q.width + end + 1] === color) end++;
            if (color !== q.background) runs++;
            x = end + 1;
        }
    }
    return runs;
};

const shapes = [];

// Big disc of color 1 on bg 0 (interior should go to fat pens, rim to chords).
{
    const W = 80, H = 80, idx = new Int32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if ((x - 40) ** 2 + (y - 40) ** 2 <= 30 * 30) idx[y * W + x] = 1;
    }
    shapes.push({ name: "disc", width: W, height: H, idx, background: 0 });
}

// Ring: color 1 with a bg hole -- caps must not paint into the hole.
{
    const W = 80, H = 80, idx = new Int32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const d2 = (x - 40) ** 2 + (y - 40) ** 2;
        if (d2 <= 32 * 32 && d2 >= 14 * 14) idx[y * W + x] = 1;
    }
    shapes.push({ name: "ring", width: W, height: H, idx, background: 0 });
}

// Adjacent rectangles of different colors -- caps must not cross the seam.
{
    const W = 60, H = 40, idx = new Int32Array(W * H);
    for (let y = 8; y < 32; y++) for (let x = 4; x < 30; x++) idx[y * W + x] = 1;
    for (let y = 8; y < 32; y++) for (let x = 30; x < 56; x++) idx[y * W + x] = 2;
    shapes.push({ name: "seam", width: W, height: H, idx, background: 0 });
}

// Big flat rectangle -- interior-dominated, where fat pens shine.
{
    const W = 160, H = 110, idx = new Int32Array(W * H);
    for (let y = 5; y < 105; y++) for (let x = 5; x < 155; x++) idx[y * W + x] = 1;
    shapes.push({ name: "rect", width: W, height: H, idx, background: 0 });
}

// Random noise -- planner should mostly emit dots/short strokes but stay safe.
{
    const W = 40, H = 30;
    const idx = Int32Array.from({ length: W * H }, () => (rnd() * 4) | 0);
    shapes.push({ name: "noise", width: W, height: H, idx, background: 0 });
}

for (const q of shapes) {
    const { strokes, covered, likely } = planStrokes({ ...q, pens });
    assertStrokesSafe(q.name, q, strokes);
    assertFullCoverage(q.name, q, covered, likely);
    const baseline = baselineRunCount(q);
    console.log(`${q.name.padEnd(6)} ${String(strokes.length).padStart(4)} strokes vs ${String(baseline).padStart(4)} baseline runs (${Math.round(100 * strokes.length / baseline)}%)`);
}

// Savings regression thresholds (set just above measured: disc 80%, ring 67%,
// seam 46%, rect interior-dominated). Small curved shapes are rim-dominated so
// their ratio is modest; the win scales with interior area.
for (const [name, maxRatio] of [["disc", 0.9], ["ring", 0.8], ["seam", 0.6], ["rect", 0.4]]) {
    const q = shapes.find(s => s.name === name);
    const { strokes } = planStrokes({ ...q, pens });
    const baseline = baselineRunCount(q);
    assert.ok(strokes.length < baseline * maxRatio,
        `${name}: expected <${maxRatio}x baseline, got ${strokes.length} strokes vs ${baseline} baseline`);
}

console.log("all stroke-planner fixtures passed");
