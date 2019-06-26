import log from "./log";

export function fill(size, image) {
    let factor = Math.max(size.width / image.width, size.height / image.height);

    let dw = factor * image.width;
    let dh = factor * image.height;

    let dx = (size.width - dw) / 2;
    let dy = (size.height - dh) / 2;

    return scale(size, ctx => ctx.drawImage(image, dx, dy, dw, dh));
};

export function fit(size, image) {
    let factor = Math.min(size.width / image.width, size.height / image.height);

    let dw = factor * image.width;
    let dh = factor * image.height;

    return scale({ width: dw, height: dh }, ctx => ctx.drawImage(image, 0, 0, dw, dh));
};

let scale = function(size, draw) {
    log(`Scaling image to ${size.width} x ${size.height}...`);

    let canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;

    let context = canvas.getContext("2d");
    context.imageSmoothingEnabled = false; // Smoothing creates weird edge color artifacts in a downsampled image.
    draw(context);

    return context.getImageData(0, 0, canvas.width, canvas.height);
};

export function getDataUrl(image) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = image.width;
    canvas.height = image.height;
    context.drawImage(image, 0, 0);

    return canvas.toDataURL();
};
