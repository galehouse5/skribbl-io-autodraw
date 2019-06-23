import color from "color-diff";

export default function (rgbPalette) {
    let labPalette = rgbPalette
        .map(rgb => color.rgb_to_lab({ R: rgb.r, G: rgb.g, B: rgb.b }));

    return {
        getClosestColor: function (rgb, cache) {
            let key = JSON.stringify(rgb);
            if (key in cache) return cache[key];

            let lab = color.rgb_to_lab({ R: rgb.r, G: rgb.g, B: rgb.b });
            let minDelta = Number.MAX_VALUE;
            let closestRgb = null;

            for (let i = 0; i < labPalette.length; i++) {
                let delta = color.diff(lab, labPalette[i]);
                if (delta >= minDelta) continue;

                minDelta = delta;
                closestRgb = rgbPalette[i];
            }

            cache[key] = closestRgb;
            return closestRgb;
        }
    }
};
