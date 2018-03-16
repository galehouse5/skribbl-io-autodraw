let canvasContainer = document.getElementById("containerCanvas");
let clearButton = document.getElementById("buttonClearCanvas");

let canvas = createCanvas(document);
let toolbar = createToolbar(document);
let artist = createArtist(canvas, toolbar, colorHelper);
let commands = [];

let showOverlay = function () {
    canvasContainer.classList.add("showAutoDrawOverlay");
    // MDN: If you want to allow a drop, you must prevent the default handling by cancelling the event. 
    event.preventDefault();
};

let hideOverlay = function () {
    canvasContainer.classList.remove("showAutoDrawOverlay");
};

let drawImage = function () {
    toolbar.clear();

    log(`Drawing ${this.width} x ${this.height} image...`);
    let helper = createImageHelper(this);
    commands = artist.draw(helper);
    processWithoutBlocking(commands, 10);
};

let stopDrawing = function () {
    if (!commands.length) return;

    log("Clearing commands...");
    commands.length = 0;
    log("Drawing stopped.");
};

let loadImage = function (url, callback) {
    let image = new Image;
    image.onload = callback;
    image.onerror = function () {
        log("Error loading image.");
    };

    log(`Loading image: ${url}...`);
    // CORS prohibits pixel access to images from a different origin.
    image.crossOrigin = "Anonymous";
    image.src = url.startsWith("http") ? ("https://cors-anywhere.herokuapp.com/" + url) : url;
};

let drawDroppedImage = function () {
    log("Processing dropped content...");
    canvasContainer.classList.remove("showAutoDrawOverlay");
    event.preventDefault();

    let imageUrl = dataTransferHelper.getImgFileUrl(event.dataTransfer)
        || dataTransferHelper.getImgElementSrc(event.dataTransfer);
    if (!imageUrl) {
        log("Dropped content not recognized.");
        return;
    };

    loadImage(imageUrl, drawImage);
}

canvasContainer.addEventListener("dragover", showOverlay);
canvasContainer.addEventListener("dragleave", hideOverlay);
canvasContainer.addEventListener("drop", drawDroppedImage);
clearButton.addEventListener("click", stopDrawing);

log("Initializing overlay...");
let overlay = document.createElement("p");
overlay.id = "autoDrawOverlay";
overlay.innerText = "Drop an image here to auto draw!";
canvasContainer.appendChild(overlay);
