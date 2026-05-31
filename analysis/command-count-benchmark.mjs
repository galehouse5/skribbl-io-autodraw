// Command-count + progressive-loading benchmark across the candidate drawing
// algorithms. Usage:
//   node analysis/command-count-benchmark.mjs            (synthetic + repo images)
//   node analysis/command-count-benchmark.mjs path...    (additional image files)
//
// Outputs a per-image table to stdout, full fidelity curves to analysis/out/*.csv,
// and progressive snapshot PNGs to analysis/out/<image>-<approach>-<pct>.png.
import fs from "fs";
import path from "path";
import { createQuantizer } from "./quantize.mjs";
import {
    currentScanline, polylineSnake, polylineShipped, bucketPainter, connectedRegions,
    horizontalRuns, simulate, commandsToFidelity, penLiftAttribution,
} from "./algorithms.mjs";
import {
    decode, fitScale, syntheticImages, writeIndexedPNG, FIT_BOX,
} from "./images.mjs";

const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), "out");
fs.mkdirSync(OUT, { recursive: true });

const quantizer = createQuantizer();

const APPROACHES = [
    ["current", currentScanline],
    ["shipped", polylineShipped],
    ["polyline", polylineSnake],
    ["bucket", bucketPainter],
];

function gatherImages() {
    const imgs = {};
    const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
    for (const name of ["icon128.png", "promo-image.png"]) {
        const p = path.join(repo, name);
        if (fs.existsSync(p)) imgs[name.replace(/\.[^.]+$/, "")] = decode(p);
    }
    Object.assign(imgs, syntheticImages());
    // Auto-include anything dropped into analysis/images/ (your own examples).
    const userDir = path.join(path.dirname(new URL(import.meta.url).pathname), "images");
    if (fs.existsSync(userDir)) {
        for (const f of fs.readdirSync(userDir)) {
            if (/\.(png|jpe?g)$/i.test(f)) imgs[f.replace(/\.[^.]+$/, "")] = decode(path.join(userDir, f));
        }
    }
    for (const p of process.argv.slice(2)) imgs[path.basename(p)] = decode(p);
    return imgs;
}

function pct(n, d) { return d ? `${(100 * n / d).toFixed(1)}%` : "-"; }

const rows = [];
const images = gatherImages();

for (const [name, raw] of Object.entries(images)) {
    const scaled = fitScale(raw, FIT_BOX);
    const q = quantizer.quantize(scaled);
    const P = q.width * q.height;
    const regions = connectedRegions(q);
    const runs = horizontalRuns(q).count;
    const colors = new Set(q.idx).size;

    console.log(`\n=== ${name}  (${q.width}x${q.height}=${P}px, ${colors} colors, ${runs} runs, ${regions.length} regions) ===`);

    for (const [aName, build] of APPROACHES) {
        const ops = aName === "polyline" ? build(q, regions)
            : aName === "bucket" ? build(q, regions)
                : build(q);
        const sim = simulate(ops, q);
        const fid = commandsToFidelity(sim.curve);
        const finalFid = sim.curve.length ? sim.curve[sim.curve.length - 1][1] : 0;

        rows.push({
            image: name, approach: aName,
            commands: sim.totalCommands, points: sim.totalPoints,
            finalFidelity: finalFid,
            f50: fid[0.5], f90: fid[0.9], f95: fid[0.95], f99: fid[0.99],
        });

        // fidelity curve CSV (downsampled to <=200 rows)
        const step = Math.max(1, Math.ceil(sim.curve.length / 200));
        const csv = ["commands,fidelity",
            ...sim.curve.filter((_, i) => i % step === 0 || i === sim.curve.length - 1)
                .map(([c, f]) => `${c},${f.toFixed(5)}`)].join("\n");
        fs.writeFileSync(path.join(OUT, `${name}-${aName}.csv`), csv);

        // snapshots
        for (const s of sim.snapshots) {
            writeIndexedPNG(
                path.join(OUT, `${name}-${aName}-${Math.round(s.fraction * 100)}pct.png`),
                q, s.buffer, q.palette);
        }

        console.log(
            `  ${aName.padEnd(9)} commands=${String(sim.totalCommands).padStart(6)} ` +
            `points=${String(sim.totalPoints).padStart(7)} ` +
            `final=${(finalFid * 100).toFixed(1)}%  ` +
            `cmds@50/90/95/99% fid = ${fid[0.5]}/${fid[0.9]}/${fid[0.95]}/${fid[0.99]}`);
    }
}

// Compact comparison table (commands), normalized to current.
console.log("\n\n# Command-count summary (relative to current scan-line)\n");
console.log("image           current   shipped   polyline   bucket    | shipped×  polyline×  bucket×");
const byImage = {};
for (const r of rows) (byImage[r.image] ||= {})[r.approach] = r;
for (const [img, a] of Object.entries(byImage)) {
    const cur = a.current.commands, ship = a.shipped.commands, poly = a.polyline.commands, buc = a.bucket.commands;
    console.log(
        `${img.padEnd(14)} ${String(cur).padStart(7)} ${String(ship).padStart(9)} ${String(poly).padStart(10)} ` +
        `${String(buc).padStart(8)}    | ${pct(ship, cur).padStart(7)}  ${pct(poly, cur).padStart(8)}  ${pct(buc, cur).padStart(7)}`);
}

// The prize: gap between the shipped chaining (real pen-lifts) and the idealized
// 1-stroke-per-region polyline. This is the most the overdraw/painter refinement
// could remove; the capturable share is the subset whose holes are non-background.
console.log("\n# Pen-lift headroom: shipped vs idealized 1-stroke-per-region\n");
console.log("image           shipped   ideal    gap   gap/shipped");
for (const [img, a] of Object.entries(byImage)) {
    const ship = a.shipped.commands, ideal = a.polyline.commands;
    const gap = ship - ideal;
    console.log(
        `${img.padEnd(14)} ${String(ship).padStart(7)} ${String(ideal).padStart(7)} ` +
        `${String(gap).padStart(6)}   ${pct(gap, ship).padStart(7)}`);
}

// Attribution: of the pen-lifts the shipped chaining makes, why does each happen?
// Tells us whether the headroom is a "hole" prize (overdraw/painter helps) or a
// "connector" prize (cheaper pen-only run-splitting helps).
console.log("\n# Pen-lift attribution (terminal=unavoidable; connector/overdraw=the gap)\n");
console.log("image           strokes  terminal  connector  overdraw | gap  connector%  overdraw%");
for (const [name, raw] of Object.entries(images)) {
    const q = quantizer.quantize(fitScale(raw, FIT_BOX));
    const t = penLiftAttribution(q);
    const gap = t.connector + t.overdraw;
    console.log(
        `${name.padEnd(14)} ${String(t.strokes).padStart(7)} ${String(t.terminal).padStart(9)} ` +
        `${String(t.connector).padStart(10)} ${String(t.overdraw).padStart(9)} | ${String(gap).padStart(4)}  ` +
        `${pct(t.connector, gap).padStart(8)}  ${pct(t.overdraw, gap).padStart(8)}`);
}

console.log(`\nSnapshots + curves written to ${OUT}`);
