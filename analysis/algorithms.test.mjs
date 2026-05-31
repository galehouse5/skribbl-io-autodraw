// Hand-checkable correctness fixtures for the analysis primitives.
//   node analysis/algorithms.test.mjs
import assert from "assert";
import {
    horizontalRuns, connectedRegions, backgroundColor,
    currentScanline, polylineSnake, bucketPainter, simulate,
} from "./algorithms.mjs";

// 4x4, left half color 0, right half color 1:
//   0 0 1 1
//   0 0 1 1
//   0 0 1 1
//   0 0 1 1
const q = {
    width: 4, height: 4,
    idx: Int32Array.from([
        0, 0, 1, 1,
        0, 0, 1, 1,
        0, 0, 1, 1,
        0, 0, 1, 1,
    ]),
    palette: [{ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }],
};

// Two runs per row -> 8 runs total.
assert.strictEqual(horizontalRuns(q).count, 8, "expected 8 horizontal runs");

// Two connected regions, 8 px each.
const regions = connectedRegions(q);
assert.strictEqual(regions.length, 2, "expected 2 regions");
assert.deepStrictEqual(regions.map(r => r.size).sort(), [8, 8]);

// Tie on area -> background is whichever wins the count scan; both have 8 px.
assert.ok([0, 1].includes(backgroundColor(q)));

// Every approach must reach 100% fidelity when fully replayed.
for (const [name, build] of [["current", currentScanline], ["polyline", polylineSnake], ["bucket", bucketPainter]]) {
    const sim = simulate(build(q, name === "current" ? undefined : regions), q);
    const final = sim.curve[sim.curve.length - 1][1];
    assert.strictEqual(final, 1, `${name} should fully reconstruct the image (got ${final})`);
}

// In a 4x4 image every pixel of the non-bg region is on its perimeter, so bucket
// here costs ~ background + outline + (empty) fill per region.
const buc = bucketPainter(q, regions);
assert.ok(buc.length >= 2, "bucket should emit a background fill plus region ops");

console.log("all analysis fixtures passed");
