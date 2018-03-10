let createImageHelper = function (image) {
    let createCanvas = function (canvasSize) {
        let canvas = document.createElement("canvas");
        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;
        return canvas;
    };

    let fill = function (canvas, context) {
        let factor = Math.max(canvas.width / image.width, canvas.height / image.height);

        let dw = factor * image.width;
        let dh = factor * image.height;

        let dx = (canvas.width - dw) / 2;
        let dy = (canvas.height - dh) / 2;

        context.drawImage(image, dx, dy, dw, dh);
    };

    let fit = function (canvas, context) {
        let factor = Math.min(canvas.width / image.width, canvas.height / image.height);

        let dw = factor * image.width;
        let dh = factor * image.height;

        let dx = (canvas.width - dw) / 2;
        let dy = (canvas.height - dh) / 2;

        context.drawImage(image, dx, dy, dw, dh);
    };

    let getImageData = function (canvas, context) {
        let imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        imageData.getRgbObject = function (coords) {
            return {
                r: this.data[4 * (coords.x + coords.y * this.width) + 0],
                g: this.data[4 * (coords.x + coords.y * this.width) + 1],
                b: this.data[4 * (coords.x + coords.y * this.width) + 2]
            };
        };

        return imageData;
    };

    let clear = function (canvas, context, color) {
        context.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
        context.fillRect(0, 0, canvas.width, canvas.height);
    };

    let normalizeImageData = function (normalize, size, backgroundColor) {
        let canvas = createCanvas(size);
        let context = canvas.getContext("2d");

        if (backgroundColor) {
            clear(canvas, context, backgroundColor);
        }

        normalize(canvas, context);
        return getImageData(canvas, context);
    };

    return {
        fillImageData: function (size, backgroundColor) {
            log(`Normalizing image to ${size.width} x ${size.height} using fill transform...`);
            return normalizeImageData(fill, size, backgroundColor);
        },

        fitImageData: function (size, backgroundColor) {
            log(`Normalizing image to ${size.width} x ${size.height} using fit transform...`);
            return normalizeImageData(fit, size, backgroundColor);
        }
    };
};
