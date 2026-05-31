import createColorPalette from "./color-palette";
import { fitImage, fillImage } from "./image-helper";
import log from "./log";

const nominalPenDiameter = 4;
// Treat the pen like it's smaller to prevent blank horizontal lines.
const realPenDiameter = 2.9;
const scaleImage = fitImage;

export default function (canvas, toolbar) {
    const colorPalette = createColorPalette(toolbar.getColors());
    const effectiveDrawingSize = {
        width: canvas.size.width / realPenDiameter,
        height: canvas.size.height / realPenDiameter
    };

    const getMostCommonColor = function (lines) {
        const counts = {};

        for (const line of lines) {
            const key = JSON.stringify(line.color);
            counts[key] = (counts[key] || 0) + 1;
        }

        const mostCommon = Object.keys(counts)
            .reduce((c1, c2) => counts[c1] > counts[c2] ? c1 : c2);
        return JSON.parse(mostCommon);
    };

    const fillCanvas = function (color) {
        return [
            function () {
                toolbar.setFillTool();
                toolbar.setColor(color);
                canvas.draw([
                    { x: 0, y: 0 },
                    { x: 0, y: 0 }
                ]);
            }
        ];
    };

    const extractLines = function (image) {
        const data = image.data;
        const colorCache = {};
        const lines = [];

        let lineStartX = 0;
        let lineColor = null;
        let i = 0;

        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                const pixelColor = { r: data[i + 0], g: data[i + 1], b: data[i + 2] };
                const paletteColor = colorPalette.getClosestColor(pixelColor, colorCache);

                if (lineColor == null) {
                    lineColor = paletteColor;
                    continue;
                }

                if (lineColor != paletteColor) {
                    lines.push({ y: y, startX: lineStartX, endX: x - 1, color: lineColor });
                    lineStartX = x;
                    lineColor = paletteColor;
                }

                i += 4;
            }

            lines.push({ y: y, startX: lineStartX, endX: image.width - 1, color: lineColor });
            lineStartX = 0;
            lineColor = null;

            i += 4;
        }

        return lines;
    };

    // Chain vertically-stacked horizontal runs of the same color into continuous
    // "snake" strokes so each connected region is drawn with far fewer pen
    // gestures (one canvas.draw call) than the per-run scan-line approach.
    //
    // Correctness: a run is only chained to a run on the next row when one of that
    // run's ends falls within the current run's x-span. The connector is then a
    // horizontal move along the current run followed by a single-column vertical
    // drop -- both segments stay inside the region, so no connector ever paints
    // across a differently-colored hole. Every run is entered at an end and swept
    // end-to-end, so coverage is exact. When no safe connector exists the stroke
    // ends and the remaining runs start their own strokes (matching the old
    // per-run behavior in the worst case).
    const buildPolylines = function (lines) {
        const runs = lines.map(l => ({
            y: l.y, startX: l.startX, endX: l.endX, color: l.color, used: false
        }));

        const byRow = new Map();
        for (const run of runs) {
            if (!byRow.has(run.y)) byRow.set(run.y, []);
            byRow.get(run.y).push(run);
        }
        for (const row of byRow.values()) row.sort((a, b) => a.startX - b.startX);

        // Deterministic start order: top-to-bottom, left-to-right.
        runs.sort((a, b) => a.y - b.y || a.startX - b.startX);

        const polylines = [];

        for (const start of runs) {
            if (start.used) continue;

            const points = [];
            let pixels = 0;

            let cur = start;
            cur.used = true;
            points.push({ x: cur.startX, y: cur.y }, { x: cur.endX, y: cur.y });
            pixels += cur.endX - cur.startX + 1;
            let exitX = cur.endX;

            while (true) {
                const below = byRow.get(cur.y + 1);
                if (!below) break;

                // Pick the unused same-color run below whose end (inside cur's
                // x-span) is closest to where the pen currently sits.
                let next = null, enterX = 0, bestDist = Infinity;
                for (const candidate of below) {
                    if (candidate.used || candidate.color !== cur.color) continue;
                    for (const end of [candidate.startX, candidate.endX]) {
                        if (end < cur.startX || end > cur.endX) continue;
                        const dist = Math.abs(end - exitX);
                        if (dist < bestDist) {
                            bestDist = dist;
                            next = candidate;
                            enterX = end;
                        }
                    }
                }
                if (!next) break;

                const farX = enterX === next.startX ? next.endX : next.startX;
                points.push({ x: enterX, y: cur.y });   // slide along cur to the connector column
                points.push({ x: enterX, y: next.y });  // single-column vertical drop into next
                points.push({ x: farX, y: next.y });    // sweep next run end-to-end
                pixels += next.endX - next.startX + 1;

                next.used = true;
                cur = next;
                exitX = farX;
            }

            polylines.push({ color: start.color, points, pixels });
        }

        // Big regions first so the image fills in coarse-to-fine.
        polylines.sort((a, b) => b.pixels - a.pixels);

        return polylines;
    };

    const drawPolylines = function (polylines, offset) {
        const commands = [];

        for (const polyline of polylines) {
            commands.push(function () {
                toolbar.setPenTool();
                toolbar.setColor(polyline.color);
                toolbar.setPenDiameter(nominalPenDiameter);
                canvas.draw(polyline.points.map(p => ({
                    x: (p.x + offset.x) * realPenDiameter,
                    y: (p.y + offset.y) * realPenDiameter
                })));
            });
        }

        return commands;
    };

    return {
        draw: function (image) {
            const scaledImage = scaleImage(effectiveDrawingSize, image);

            log("Generating draw commands...");
            let commands = [];

            const allLines = extractLines(scaledImage);
            const mostCommonColor = getMostCommonColor(allLines);
            commands = commands.concat(fillCanvas(mostCommonColor));

            // Don't need to draw lines that match the fill color.
            const filteredLines = allLines
                .filter(l => JSON.stringify(l.color) != JSON.stringify(mostCommonColor));

            const polylines = buildPolylines(filteredLines);

            let drawingOffset = {
                x: (effectiveDrawingSize.width - scaledImage.width) / 2 + 0.5,
                y: (effectiveDrawingSize.height - scaledImage.height) / 2 + 0.5
            };
            commands = commands.concat(drawPolylines(polylines, drawingOffset));

            log(`${commands.length} commands generated.`);
            return commands;
        }
    };
};
