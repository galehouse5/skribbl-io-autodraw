import createColorPalette from "./color-palette";
import { fitImage, fillImage } from "./image-helper";
import log from "./log";

const penDiameter = 2.9;
const scaleImage = fitImage;

export default function (canvas, toolbar) {
    const colorPalette = createColorPalette(toolbar.getColors());
    const effectiveDrawingSize = {
        width: canvas.size.width / penDiameter,
        height: canvas.size.height / penDiameter
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

    const drawLines = function (lines, offset) {
        const commands = [];

        for (const line of lines) {
            commands.push(function () {
                toolbar.setPenTool();
                toolbar.setColor(line.color);
                toolbar.setPenDiameter(penDiameter);
                canvas.draw([
                    { x: (line.startX + offset.x) * penDiameter, y: (line.y + offset.y) * penDiameter },
                    { x: (line.endX + offset.x) * penDiameter, y: (line.y + offset.y) * penDiameter }
                ]);
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

            const sortedLines = filteredLines
                // Randomize drawing order so the overall image becomes apparent sooner.
                .sort(() => 0.5 - Math.random())
                // Long and short lines take the same time to draw. Draw long ones first so the image fills in faster.
                .sort((l1, l2) => {
                    const length1 = l1.endX - l1.startX;
                    const length2 = l2.endX - l2.startX;
                    return length1 > length2 ? -1 : length1 == length2 ? 0 : /* length1 < length2 ? */ 1;
                });

            let drawingOffset = {
                x: (effectiveDrawingSize.width - scaledImage.width) / 2 + 0.5,
                y: (effectiveDrawingSize.height - scaledImage.height) / 2 + 0.5
            };
            commands = commands.concat(drawLines(sortedLines, drawingOffset));

            log(`${commands.length} commands generated.`);
            return commands;
        }
    };
};
