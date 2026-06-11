import log from "./log";

// In-game instrumentation for measuring how skribbl captures synthesized pointer
// strokes. Draws a known boustrophedon (zigzag) pattern under different dispatch
// strategies, then DIFFS the canvas against its just-cleared state to measure how
// much of each row actually rendered. Diffing (vs a fixed-point dark-pixel probe)
// is color-agnostic and position-robust, and reports partial sweeps, not just a
// boolean. Results go to the DevTools console: live progress, a console.table
// summary, a per-scenario ASCII row-map, and one copyable JSON blob.
//
// Run from a game where you're the drawer (toolbar visible): press Ctrl+Shift+Y.
// The canvas is cleared between scenarios. Keep the tab focused -- paced scenarios
// use requestAnimationFrame/timers, which browsers throttle in background tabs.

const LOGICAL = { width: 800, height: 600 };
const ROWS = 16;
const X0 = 120, X1 = 680, DY = 30;
const Y0 = 90;                 // rows 90..540
const PAD = 40;                // ignore the turnaround verticals near X0/X1
const PEN = 20;                // fat pen -> lines are unmissable
const ROW_HIT_FRACTION = 0.5;  // a row "rendered" if >=50% of its width inked
const DIFF = 60;               // sum of abs channel deltas to count a pixel changed

export default function (canvasElement, toolbar) {
    const context = canvasElement.getContext("2d");

    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));

    const toClient = function (coords) {
        const bounds = canvasElement.getBoundingClientRect();
        return {
            x: coords.x * bounds.width / LOGICAL.width + bounds.x,
            y: coords.y * bounds.height / LOGICAL.height + bounds.y
        };
    };

    // pressed=null mimics src/canvas.js exactly (no buttons property); pressed=true
    // reports the left button held during down/move.
    const pointerEvent = function (name, coords, pressed) {
        const client = toClient(coords);
        const init = {
            pointerId: 1, pointerType: "mouse", bubbles: true,
            clientX: client.x, clientY: client.y, button: 0
        };
        if (pressed !== null) init.buttons = name === "pointerup" ? 0 : pressed ? 1 : 0;
        return new PointerEvent(name, init);
    };

    // One pointerdown..pointerup gesture. With neither perFrame nor gapMs, every
    // move is dispatched synchronously (the shipped behavior). perFrame=k yields a
    // rAF every k moves; gapMs=t waits t ms after every move (explicit pacing,
    // independent of refresh rate).
    const dispatchStroke = async function (points, { pressed = null, perFrame = null, gapMs = null } = {}) {
        canvasElement.dispatchEvent(pointerEvent("pointerdown", points[0], pressed));
        for (let i = 1; i < points.length; i++) {
            canvasElement.dispatchEvent(pointerEvent("pointermove", points[i], pressed));
            if (gapMs !== null) await wait(gapMs);
            else if (perFrame !== null && (i % perFrame) === 0) await nextFrame();
        }
        canvasElement.dispatchEvent(pointerEvent("pointerup", points[points.length - 1], pressed));
    };

    // Boustrophedon: ROWS horizontal sweeps joined by short vertical connectors.
    const zigzag = function () {
        const points = [];
        for (let r = 0; r < ROWS; r++) {
            const y = Y0 + r * DY;
            const [from, to] = r % 2 === 0 ? [X0, X1] : [X1, X0];
            if (r === 0) points.push({ x: from, y });
            points.push({ x: to, y });
            if (r < ROWS - 1) points.push({ x: to, y: y + DY });
        }
        return points;
    };

    // The pre-polyline behavior: ROWS independent 2-point strokes. gapMs spaces
    // them (0 = one setTimeout tick, as in non-blocking-processor.js).
    const baselineStrokes = gapMs => async function () {
        for (let r = 0; r < ROWS; r++) {
            await wait(gapMs);
            await dispatchStroke([{ x: X0, y: Y0 + r * DY }, { x: X1, y: Y0 + r * DY }]);
        }
    };

    const snapshot = () => context.getImageData(0, 0, canvasElement.width, canvasElement.height).data;

    // For each row, scan its full-width band and report the fraction of columns
    // whose pixels changed vs the cleared baseline. Color-agnostic, position-robust.
    const measure = function (base, after) {
        const sx = canvasElement.width / LOGICAL.width;
        const sy = canvasElement.height / LOGICAL.height;
        const W = canvasElement.width;
        const fractions = [];
        for (let r = 0; r < ROWS; r++) {
            const yc = (Y0 + r * DY) * sy;
            const y2 = Math.max(0, Math.round(yc - (DY / 2 - 2) * sy));
            const y3 = Math.min(canvasElement.height - 1, Math.round(yc + (DY / 2 - 2) * sy));
            const x2 = Math.round((X0 + PAD) * sx), x3 = Math.round((X1 - PAD) * sx);
            let inkedCols = 0, totalCols = 0;
            for (let x = x2; x <= x3; x++) {
                totalCols++;
                let inked = false;
                for (let y = y2; y <= y3 && !inked; y++) {
                    const i = (y * W + x) * 4;
                    const d = Math.abs(after[i] - base[i]) + Math.abs(after[i + 1] - base[i + 1])
                        + Math.abs(after[i + 2] - base[i + 2]);
                    if (d > DIFF) inked = true;
                }
                if (inked) inkedCols++;
            }
            fractions.push(totalCols ? inkedCols / totalCols : 0);
        }
        return fractions;
    };

    const results = [];

    const runScenario = async function (name, points, fn) {
        toolbar.clear();
        await wait(600);
        const base = snapshot();

        const t0 = performance.now();
        await fn();
        const drawMs = Math.round(performance.now() - t0);

        // immediate = rendered locally; settled = survives skribbl's network echo.
        await nextFrame();
        const immediate = measure(base, snapshot());
        await wait(1500);
        const settled = measure(base, snapshot());

        const rendered = settled.filter(f => f >= ROW_HIT_FRACTION).length;
        const partial = settled.filter(f => f > 0.02 && f < ROW_HIT_FRACTION).length;
        const meanFill = settled.reduce((s, f) => s + f, 0) / ROWS;
        results.push({
            name, points, drawMs, rows: ROWS, rendered, partial,
            meanFill: +meanFill.toFixed(3),
            immediateFractions: immediate.map(f => +f.toFixed(2)),
            settledFractions: settled.map(f => +f.toFixed(2))
        });

        const map = settled.map(f => f >= ROW_HIT_FRACTION ? "#" : f > 0.02 ? ":" : ".").join("");
        log(`diag ${name}: ${rendered}/${ROWS} rows (${partial} partial), mean fill ${(meanFill * 100) | 0}%, ${drawMs}ms  [${map}]`);
    };

    let running = false;

    return {
        run: async function () {
            if (running) return log("Diagnostics already running.");
            if (!toolbar.isEnabled()) return log("Diagnostics need the toolbar -- you must be the drawer.");

            running = true;
            results.length = 0;
            log("Diagnostics starting: ~40s, the canvas will be cleared repeatedly. Keep this tab focused.");

            try {
                const colors = toolbar.getColors();
                const darkest = colors.reduce((c1, c2) => c1.r + c1.g + c1.b <= c2.r + c2.g + c2.b ? c1 : c2);
                toolbar.setPenTool();
                toolbar.setColor(darkest);
                toolbar.setPenDiameter(PEN);
                await wait(300);

                const z = zigzag();
                // Controls: the production per-run method, fast and spaced.
                await runScenario("baseline-strokes-0ms", 2 * ROWS, baselineStrokes(0));
                await runScenario("baseline-strokes-16ms", 2 * ROWS, baselineStrokes(16));
                // The shipped polyline dispatch and the pointer-state variant.
                await runScenario("burst-shipped", z.length, () => dispatchStroke(z));
                await runScenario("burst-buttons1", z.length, () => dispatchStroke(z, { pressed: true }));
                // Frame-paced (refresh-rate dependent).
                await runScenario("raf-1", z.length, () => dispatchStroke(z, { perFrame: 1 }));
                await runScenario("raf-4", z.length, () => dispatchStroke(z, { perFrame: 4 }));
                // Explicitly time-paced (refresh-rate independent) -- the real test.
                await runScenario("paced-8ms", z.length, () => dispatchStroke(z, { gapMs: 8 }));
                await runScenario("paced-16ms", z.length, () => dispatchStroke(z, { gapMs: 16 }));
                await runScenario("paced-33ms", z.length, () => dispatchStroke(z, { gapMs: 33 }));

                console.table(results.map(r => ({
                    scenario: r.name, "points": r.points, "draw ms": r.drawMs,
                    "rows rendered": `${r.rendered}/${r.rows}`, "partial": r.partial,
                    "mean fill": `${(r.meanFill * 100) | 0}%`
                })));
                console.log("skribbl.io AutoDraw diagnostics JSON (copy everything between the braces):\n"
                    + JSON.stringify({
                        when: new Date().toISOString(),
                        userAgent: navigator.userAgent,
                        devicePixelRatio: window.devicePixelRatio,
                        canvas: { width: canvasElement.width, height: canvasElement.height,
                            cssWidth: Math.round(canvasElement.getBoundingClientRect().width) },
                        config: { ROWS, X0, X1, Y0, DY, PEN, ROW_HIT_FRACTION, DIFF },
                        results
                    }));
                log("Diagnostics finished -- see the table, the [row-maps] above, and the JSON.");
            } catch (error) {
                log(`Diagnostics failed: ${error.message}`);
                console.error(error);
            } finally {
                running = false;
            }
        }
    };
};
