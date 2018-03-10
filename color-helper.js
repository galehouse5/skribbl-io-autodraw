let colorHelper = {
    // Taken from: https://www.compuphase.com/cmetric.htm
    getColorDistance: function (color1, color2) {
        let rmean = (color1.r + color2.r) / 2;
        let r = color1.r - color2.r;
        let g = color1.g - color2.g;
        let b = color1.b - color2.b;
        return Math.sqrt((((512 + rmean) * r * r) >> 8)
            + 4 * g * g + (((767 - rmean) * b * b) >> 8));
    },

    getClosestColor: function (targetColor, colorPalette) {
        let minDistance = Number.MAX_VALUE;
        let closestColor = null;

        for (let color of colorPalette) {
            let distance = this.getColorDistance(targetColor, color);
            if (distance >= minDistance) continue;

            minDistance = distance;
            closestColor = color;
        }

        return closestColor;
    }
};
