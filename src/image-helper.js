import log from "./log";

export function fillImage(size, image) {
    let factor = Math.max(size.width / image.width, size.height / image.height);

    let dw = factor * image.width;
    let dh = factor * image.height;

    let dx = (size.width - dw) / 2;
    let dy = (size.height - dh) / 2;

    return scale(size, ctx => ctx.drawImage(image, dx, dy, dw, dh));
};

export function fitImage(size, image) {
    let factor = Math.min(size.width / image.width, size.height / image.height);

    let dw = factor * image.width;
    let dh = factor * image.height;

    return scale({ width: dw, height: dh }, ctx => ctx.drawImage(image, 0, 0, dw, dh));
};

let scale = function (size, draw) {
    log(`Scaling image to ${size.width} x ${size.height}...`);

    let canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;

    let context = canvas.getContext("2d");
    context.imageSmoothingEnabled = false; // Smoothing creates weird edge color artifacts in a downsampled image.
    draw(context);

    return context.getImageData(0, 0, canvas.width, canvas.height);
};

export function loadImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image;
        image.crossOrigin = "Anonymous";
        image.onload = function () {
            const blockedByCors = image.height === image.width === 0;
            const executor = blockedByCors ? reject : resolve;
            executor(image);
        };
        image.onerror = reject;

        log(`Attempting to load image: ${url}...`);
        image.src = url;
    });
};
