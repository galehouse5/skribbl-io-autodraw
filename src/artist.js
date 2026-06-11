import createColorPalette from "./color-palette";
import { fitImage } from "./image-helper";
import log from "./log";
import { planStrokes } from "./stroke-planner.mjs";

// Skribbl draws strokes with round caps; the smallest pen's reliable coverage
// width is ~2.9 canvas px (hence the historical realPenDiameter), so the image
// is planned on a grid of 1 image px = 2.9 canvas px.
const realPenDiameter = 2.9;
// Largest first: fat pens take region interiors, the 4px edge pen takes
// boundaries and detail with the historical sub-pixel slop.
const penDiameters = [40, 20, 10, 4];
const scaleImage = fitImage;

export default function (canvas, toolbar) {
    const colorPalette = createColorPalette(toolbar.getColors());
    const effectiveDrawingSize = {
        width: canvas.size.width / realPenDiameter,
        height: canvas.size.height / realPenDiameter
    };

    // Map every pixel to its palette color, as an index grid plus color table.
    const quantize = function (image) {
        const data = image.data;
        const colorCache = {};
        const colors = [];
        const indexByKey = new Map();
        const idx = new Int32Array(image.width * image.height);

        for (let p = 0, i = 0; p < idx.length; p++, i += 4) {
            const color = colorPalette.getClosestColor(
                { r: data[i + 0], g: data[i + 1], b: data[i + 2] }, colorCache);
            const key = JSON.stringify(color);
            let colorIndex = indexByKey.get(key);
            if (colorIndex === undefined) {
                colorIndex = colors.length;
                colors.push(color);
                indexByKey.set(key, colorIndex);
            }
            idx[p] = colorIndex;
        }

        return { idx, colors };
    };

    // Background = most common color by horizontal run count (the historical
    // heuristic: cheap proxy for "the color that costs most to draw").
    const getMostCommonColor = function (idx, width, height) {
        const counts = new Map();
        for (let y = 0; y < height; y++) {
            let color = idx[y * width];
            counts.set(color, (counts.get(color) || 0) + 1);
            for (let x = 1; x < width; x++) {
                const c = idx[y * width + x];
                if (c !== color) {
                    color = c;
                    counts.set(color, (counts.get(color) || 0) + 1);
                }
            }
        }
        let best = 0, bestCount = -1;
        for (const [color, count] of counts) {
            if (count > bestCount) { best = color; bestCount = count; }
        }
        return best;
    };

    const fillCanvas = function (color) {
        return function () {
            toolbar.setFillTool();
            toolbar.setColor(color);
            canvas.draw([
                { x: 0, y: 0 },
                { x: 0, y: 0 }
            ]);
        };
    };

    const drawStroke = function (stroke, color, offset) {
        return function () {
            toolbar.setPenTool();
            toolbar.setColor(color);
            toolbar.setPenDiameter(stroke.diameter);
            canvas.draw([
                { x: (stroke.x1 + offset.x) * realPenDiameter, y: (stroke.y1 + offset.y) * realPenDiameter },
                { x: (stroke.x2 + offset.x) * realPenDiameter, y: (stroke.y2 + offset.y) * realPenDiameter }
            ]);
        };
    };

    return {
        draw: function (image) {
            const scaledImage = scaleImage(effectiveDrawingSize, image);

            log("Generating draw commands...");
            const { idx, colors } = quantize(scaledImage);
            const background = getMostCommonColor(idx, scaledImage.width, scaledImage.height);

            const { strokes } = planStrokes({
                width: scaledImage.width,
                height: scaledImage.height,
                idx,
                background,
                pens: penDiameters.map(d => ({
                    diameter: d,
                    radiusImg: d / realPenDiameter / 2,
                    edge: d === penDiameters[penDiameters.length - 1]
                }))
            });

            // Fat pens first, biggest yield first: the image comes into focus
            // coarse-to-fine.
            strokes.sort((s1, s2) => s2.diameter - s1.diameter || s2.covers - s1.covers);

            const drawingOffset = {
                x: (effectiveDrawingSize.width - scaledImage.width) / 2 + 0.5,
                y: (effectiveDrawingSize.height - scaledImage.height) / 2 + 0.5
            };

            const commands = [fillCanvas(colors[background])]
                .concat(strokes.map(s => drawStroke(s, colors[s.color], drawingOffset)));

            const byPen = {};
            for (const s of strokes) byPen[s.diameter] = (byPen[s.diameter] || 0) + 1;
            const breakdown = penDiameters
                .filter(d => byPen[d])
                .map(d => `${byPen[d]}x pen ${d}`)
                .join(", ");
            log(`${commands.length} commands generated (fill + ${breakdown}).`);
            return commands;
        }
    };
};
