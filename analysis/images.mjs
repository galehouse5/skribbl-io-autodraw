// Image helpers: decode PNG/JPEG, nearest-neighbor fit-scale to the extension's
// effective drawing box, synthetic test-image generators, and a PNG writer for
// progressive snapshots.
import fs from "fs";
import { PNG } from "pngjs";
import jpeg from "jpeg-js";

// Mirrors src/artist.js effectiveDrawingSize (800/2.9 x 600/2.9) with smoothing off.
export const FIT_BOX = { width: Math.floor(800 / 2.9), height: Math.floor(600 / 2.9) };

// -> { width, height, data: RGBA }
export function decode(path) {
    const buf = fs.readFileSync(path);
    if (path.toLowerCase().endsWith(".png")) {
        const png = PNG.sync.read(buf);
        return { width: png.width, height: png.height, data: png.data };
    }
    const img = jpeg.decode(buf, { useTArray: true });
    return { width: img.width, height: img.height, data: img.data };
}

// fitImage analog: scale (down) to fit inside box, preserve aspect, nearest-neighbor.
export function fitScale(img, box = FIT_BOX) {
    const factor = Math.min(box.width / img.width, box.height / img.height, 1);
    const W = Math.max(1, Math.round(img.width * factor));
    const H = Math.max(1, Math.round(img.height * factor));
    const data = new Uint8ClampedArray(W * H * 4);
    for (let y = 0; y < H; y++) {
        const sy = Math.min(img.height - 1, (y / factor) | 0);
        for (let x = 0; x < W; x++) {
            const sx = Math.min(img.width - 1, (x / factor) | 0);
            const s = (sy * img.width + sx) * 4;
            const d = (y * W + x) * 4;
            data[d] = img.data[s]; data[d + 1] = img.data[s + 1];
            data[d + 2] = img.data[s + 2]; data[d + 3] = 255;
        }
    }
    return { width: W, height: H, data };
}

// --- Synthetic archetypes (built directly at fit-box size) ---------------

function blank(W, H, rgb) {
    const data = new Uint8ClampedArray(W * H * 4);
    for (let p = 0; p < W * H; p++) {
        data[p * 4] = rgb[0]; data[p * 4 + 1] = rgb[1]; data[p * 4 + 2] = rgb[2]; data[p * 4 + 3] = 255;
    }
    return { width: W, height: H, data };
}
function set(img, x, y, rgb) {
    if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
    const d = (y * img.width + x) * 4;
    img.data[d] = rgb[0]; img.data[d + 1] = rgb[1]; img.data[d + 2] = rgb[2];
}
function disc(img, cx, cy, r, rgb) {
    for (let y = cy - r; y <= cy + r; y++)
        for (let x = cx - r; x <= cx + r; x++)
            if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) set(img, x, y, rgb);
}

export function syntheticImages() {
    const { width: W, height: H } = FIT_BOX;
    const out = {};

    // 3-stripe flag: each row is one color (extremes for N_runs vs R).
    {
        const img = blank(W, H, [239, 19, 11]);
        for (let y = 0; y < H; y++) {
            const rgb = y < H / 3 ? [0, 178, 255] : y < 2 * H / 3 ? [255, 255, 255] : [239, 19, 11];
            for (let x = 0; x < W; x++) set(img, x, y, rgb);
        }
        out["flag"] = img;
    }

    // 2-color logo: black blob on white.
    {
        const img = blank(W, H, [255, 255, 255]);
        disc(img, (W / 2) | 0, (H / 2) | 0, (Math.min(W, H) * 0.35) | 0, [0, 0, 0]);
        out["logo"] = img;
    }

    // Cartoon face: handful of flat regions.
    {
        const img = blank(W, H, [0, 178, 255]);            // sky background
        disc(img, (W / 2) | 0, (H / 2) | 0, (Math.min(W, H) * 0.4) | 0, [255, 228, 0]);   // face
        disc(img, (W * 0.4) | 0, (H * 0.42) | 0, 7, [0, 0, 0]);   // eye
        disc(img, (W * 0.6) | 0, (H * 0.42) | 0, 7, [0, 0, 0]);   // eye
        disc(img, (W / 2) | 0, (H * 0.62) | 0, 12, [239, 19, 11]); // mouth
        for (let x = 0; x < W; x++) for (let y = 0; y < H * 0.18; y++) set(img, x, y, [99, 48, 13]); // hair band
        out["cartoon"] = img;
    }

    // Gradient/photo proxy: smooth radial gradient + noise (quantizes into many regions).
    {
        const img = blank(W, H, [0, 0, 0]);
        const cx = W / 2, cy = H / 2, max = Math.hypot(cx, cy);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const t = Math.hypot(x - cx, y - cy) / max;
            const n = (Math.random() - 0.5) * 40;
            set(img, x, y, [255 * (1 - t) + n, 255 * t + n, 128 + 127 * Math.sin(t * 6) + n]);
        }
        out["gradient"] = img;
    }

    return out;
}

// --- PNG snapshot writer -------------------------------------------------

export function writeIndexedPNG(path, q, buffer, palette, scale = 3) {
    const W = q.width * scale, H = q.height * scale;
    const png = new PNG({ width: W, height: H });
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const sp = ((y / scale) | 0) * q.width + ((x / scale) | 0);
        const idx = buffer[sp];
        const c = idx === -1 ? { r: 245, g: 245, b: 245 } : palette[idx];
        const d = (y * W + x) * 4;
        png.data[d] = c.r; png.data[d + 1] = c.g; png.data[d + 2] = c.b; png.data[d + 3] = 255;
    }
    fs.writeFileSync(path, PNG.sync.write(png));
}
