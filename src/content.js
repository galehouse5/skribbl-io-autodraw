import createCanvas from "./canvas";
import createToolbar from "./toolbar";
import createArtist from "./artist";
import { getImgFileUrl, getImgElementSrc } from "./data-transfer-helper";
import log from "./log";
import processWithoutBlocking from "./non-blocking-processor";

let canvasContainer = document.getElementById("containerCanvas");
let clearButton = document.getElementById("buttonClearCanvas");

let canvas = createCanvas(document);
let toolbar = createToolbar(document);
let artist = createArtist(canvas, toolbar);
let commands = [];

let showOverlay = function () {
    canvasContainer.classList.add("showAutoDrawOverlay");
    // MDN: If you want to allow a drop, you must prevent the default handling by cancelling the event. 
    event.preventDefault();
};

let hideOverlay = function () {
    canvasContainer.classList.remove("showAutoDrawOverlay");
};

let drawImage = function (image) {
    log("Clearing canvas...");
    toolbar.clear();

    // The clear command is processed after a ~100ms delay. Some of our drawing will be cleared unless we wait.
    setTimeout(function () {
        log(`Drawing ${image.width} x ${image.height} image...`);
        commands = commands.concat(artist.draw(image));
        processWithoutBlocking(commands, 10);
    }, 150);
};

let stopDrawing = function () {
    if (!commands.length) return;

    log("Clearing commands...");
    commands.length = 0;
    log("Drawing stopped.");
};

let drawDroppedImage = function () {
    log("Processing dropped content...");
    canvasContainer.classList.remove("showAutoDrawOverlay");
    event.preventDefault();

    let imageUrl = getImgFileUrl(event.dataTransfer)
        || getImgElementSrc(event.dataTransfer);
    if (!imageUrl) {
        log("Dropped content not recognized.");
        return;
    };

    log(`Loading image: ${imageUrl}...`);
    // Go through this ceremony to work around CORS restrictions.
    chrome.runtime.sendMessage(
        { contentScriptQuery: "loadImageDataUrl", url: imageUrl },
        dataUrl => {
            const image = new Image;
            image.src = dataUrl;
            drawImage(image);
        });
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
