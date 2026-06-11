import log from "./log";

// In-game instrumentation for measuring how skribbl captures synthesized pointer
// strokes. Draws a known boustrophedon (zigzag) pattern under different dispatch
// strategies, then reads the canvas pixels back at probe points to count how many
// rows actually rendered. Results go to the DevTools console: live progress lines,
// a console.table summary, and one copyable JSON blob for offline analysis.
//
// Run from a game where you're the drawer (toolbar visible): press Ctrl+Shift+Y.
// The canvas is cleared between scenarios. Keep the tab focused -- the paced
// scenarios use requestAnimationFrame, which browsers throttle in background tabs.

const LOGICAL = { width: 800, height: 600 };
const ROWS = 20;
const X0 = 100, X1 = 700, PROBE_X = 400;
const Y0 = 80, DY = 24; // rows 80..536, spacing >> pen diameter so probes are independent

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

    // pressed=null mimics src/canvas.js exactly (no buttons property -> defaults
    // to 0); pressed=true reports the left button held during down/move.
    const pointerEvent = function (name, coords, pressed) {
        const client = toClient(coords);
        const init = {
            pointerId: 1,
            pointerType: "mouse",
            bubbles: true,
            clientX: client.x,
            clientY: client.y,
            button: 0
        };
        if (pressed !== null) init.buttons = name === "pointerup" ? 0 : pressed ? 1 : 0;
        return new PointerEvent(name, init);
    };

    // One pointerdown..pointerup gesture. perFrame=null dispatches every move
    // synchronously (the shipped behavior); perFrame=k yields a rAF after every
    // k moves.
    const dispatchStroke = async function (points, { pressed = null, perFrame = null } = {}) {
        canvasElement.dispatchEvent(pointerEvent("pointerdown", points[0], pressed));

        for (let i = 1; i < points.length; i++) {
            canvasElement.dispatchEvent(pointerEvent("pointermove", points[i], pressed));
            if (perFrame !== null && (i % perFrame) === 0) await nextFrame();
        }

        canvasElement.dispatchEvent(pointerEvent("pointerup", points[points.length - 1], pressed));
    };

    // Boustrophedon: ROWS horizontal sweeps joined by short vertical connectors.
    // 2*ROWS points total; each row's midpoint is a probe that only inks if that
    // row's sweep was captured.
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

    // The pre-polyline behavior: ROWS independent 2-point strokes, one per
    // setTimeout tick, as a correctness control and a wall-clock baseline.
    const baselineStrokes = async function () {
        for (let r = 0; r < ROWS; r++) {
            await wait(0);
            await dispatchStroke([{ x: X0, y: Y0 + r * DY }, { x: X1, y: Y0 + r * DY }]);
        }
    };

    // A row counts as rendered if any pixel in a 5x5 patch at its midpoint is
    // dark and opaque. Returns one boolean per row.
    const readProbes = function () {
        const sx = canvasElement.width / LOGICAL.width;
        const sy = canvasElement.height / LOGICAL.height;
        const hits = [];
        for (let r = 0; r < ROWS; r++) {
            const cx = Math.round(PROBE_X * sx), cy = Math.round((Y0 + r * DY) * sy);
            const d = context.getImageData(cx - 2, cy - 2, 5, 5).data;
            let ink = false;
            for (let i = 0; i < d.length; i += 4) {
                if (d[i] < 200 && d[i + 1] < 200 && d[i + 3] > 128) { ink = true; break; }
            }
            hits.push(ink);
        }
        return hits;
    };

    const results = [];

    const runScenario = async function (name, points, fn) {
        toolbar.clear();
        await wait(600);

        const t0 = performance.now();
        await fn();
        const drawMs = Math.round(performance.now() - t0);

        // immediate = what skribbl rendered locally; settled = what survives its
        // network echo (catches the draw-then-cleared failure mode).
        await nextFrame();
        const immediateHits = readProbes();
        await wait(1500);
        const settledHits = readProbes();

        const immediate = immediateHits.filter(Boolean).length;
        const settled = settledHits.filter(Boolean).length;
        results.push({ name, points, drawMs, immediate, settled, rows: ROWS, immediateHits, settledHits });
        log(`diag ${name}: ${settled}/${ROWS} rows settled (${immediate} immediate), draw took ${drawMs}ms`);
    };

    let running = false;

    return {
        run: async function () {
            if (running) return log("Diagnostics already running.");
            if (!toolbar.isEnabled()) return log("Diagnostics need the toolbar -- you must be the drawer.");

            running = true;
            results.length = 0;
            log("Diagnostics starting: ~30s, the canvas will be cleared repeatedly. Keep this tab focused.");

            try {
                const colors = toolbar.getColors();
                const darkest = colors.reduce((c1, c2) => c1.r + c1.g + c1.b <= c2.r + c2.g + c2.b ? c1 : c2);
                toolbar.setPenTool();
                toolbar.setColor(darkest);
                toolbar.setPenDiameter(4);
                await wait(300);

                const z = zigzag();
                await runScenario("baseline-2pt-strokes", 2 * ROWS, baselineStrokes);
                await runScenario("burst-shipped", z.length, () => dispatchStroke(z));
                await runScenario("burst-buttons1", z.length, () => dispatchStroke(z, { pressed: true }));
                await runScenario("raf-1", z.length, () => dispatchStroke(z, { perFrame: 1 }));
                await runScenario("raf-1-buttons1", z.length, () => dispatchStroke(z, { perFrame: 1, pressed: true }));
                for (const k of [2, 4, 8, 16, 32]) {
                    await runScenario(`raf-${k}`, z.length, () => dispatchStroke(z, { perFrame: k }));
                }

                console.table(results.map(r => ({
                    scenario: r.name,
                    "points sent": r.points,
                    "draw ms": r.drawMs,
                    "rows immediate": `${r.immediate}/${r.rows}`,
                    "rows settled": `${r.settled}/${r.rows}`
                })));
                console.log("skribbl.io AutoDraw diagnostics JSON (copy everything between the braces):\n"
                    + JSON.stringify({
                        when: new Date().toISOString(),
                        userAgent: navigator.userAgent,
                        canvas: { width: canvasElement.width, height: canvasElement.height },
                        results
                    }));
                log("Diagnostics finished -- see the table and JSON above.");
            } catch (error) {
                log(`Diagnostics failed: ${error.message}`);
                console.error(error);
            } finally {
                running = false;
            }
        }
    };
};
