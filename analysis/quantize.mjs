// RGB -> nearest palette-color quantization, mirroring src/color-palette.js
// (LAB delta-E via the color-diff dependency the extension already uses).
import { createRequire } from "module";

const { rgb_to_lab, diff } = createRequire(import.meta.url)("color-diff");

// skribbl.io's fixed 22-color default palette (2 rows of 11).
export const SKRIBBL_PALETTE = [
    "#ffffff", "#c1c1c1", "#ef130b", "#ff7100", "#ffe400", "#00cc00",
    "#00b2ff", "#231fd3", "#a300ba", "#d37caa", "#a0522d",
    "#000000", "#4c4c4c", "#740b07", "#c23800", "#e8a200", "#005510",
    "#00569e", "#0e0865", "#550069", "#a75574", "#63300d",
].map(hex => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
}));

export function createQuantizer(palette = SKRIBBL_PALETTE) {
    const lab = palette.map(c => rgb_to_lab({ R: c.r, G: c.g, B: c.b }));
    const cache = new Map();

    function nearestIndex(r, g, b) {
        const key = (r << 16) | (g << 8) | b;
        const hit = cache.get(key);
        if (hit !== undefined) return hit;

        const l = rgb_to_lab({ R: r, G: g, B: b });
        let min = Infinity, idx = 0;
        for (let i = 0; i < lab.length; i++) {
            const d = diff(l, lab[i]);
            if (d < min) { min = d; idx = i; }
        }
        cache.set(key, idx);
        return idx;
    }

    // img: { width, height, data: RGBA Uint8 } -> { width, height, idx: Int32Array }
    function quantize(img) {
        const n = img.width * img.height;
        const idx = new Int32Array(n);
        for (let p = 0, j = 0; p < n; p++, j += 4) {
            idx[p] = nearestIndex(img.data[j], img.data[j + 1], img.data[j + 2]);
        }
        return { width: img.width, height: img.height, idx, palette };
    }

    return { nearestIndex, quantize, palette };
}
