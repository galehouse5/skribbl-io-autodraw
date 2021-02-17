import createCanvas from "./canvas";
import createToolbar from "./toolbar";
import createArtist from "./artist";
import { getImgFileUrl, getImgElementSrc } from "./data-transfer-helper";
import { loadImage } from "./image-helper";
import log from "./log";
import processWithoutBlocking from "./non-blocking-processor";
import listenForDragDropEvents from "./drag-drop-event-listener";

const canvasContainer = document.getElementById("containerCanvas");
const clearButton = document.getElementById("buttonClearCanvas");
const canvas = createCanvas(document.getElementById("canvasGame"));
const toolbar = createToolbar(document.querySelector(".containerToolbar"));
const artist = createArtist(canvas, toolbar);
const overlay = document.createElement("div");
overlay.id = "autoDrawOverlay";

let commands = [];

const hideOverlay = function (delay) {
    setTimeout(function () {
        document.body.classList.remove("showingAutodrawOverlay");
    }, delay || 0);
};

const showOverlay = function (text) {
    overlay.innerText = text;
    document.body.classList.add("showingAutodrawOverlay");
};

const handleDragEnter = function () {
    if (!toolbar.isEnabled()) return;
    showOverlay("Drop image here to auto draw!");
};

const drawImage = function (image) {
    log("Clearing canvas...");
    toolbar.clear();

    // The clear command is echoed back by the server, which then clears the canvas a second time.
    // We can't start drawing until after that second clear or we'll lose some of our work.
    canvas.awaitClear(function () {
        log(`Drawing ${image.width} x ${image.height} image...`);
        commands = commands.concat(artist.draw(image));
        hideOverlay();
        processWithoutBlocking(commands, /* shouldStop: */ () => !toolbar.isEnabled());
    });
};

const stopDrawing = function () {
    if (!commands.length) return;

    log("Clearing commands...");
    commands.length = 0;
    log("Drawing stopped.");
};

const handleDrop = function (event) {
    event.preventDefault();

    if (!canvasContainer.contains(event.target))
        return hideOverlay();

    if (!toolbar.isEnabled()) {
        log("Can't draw right now.");
        return hideOverlay();
    } 

    log("Processing dropped content...");
    showOverlay("Auto draw is loading image...");
    const imageUrl = getImgFileUrl(event.dataTransfer)
        || getImgElementSrc(event.dataTransfer);
    if (!imageUrl) {
        showOverlay("Auto draw couldn't load image :(");
        log("Dropped content not recognized.");
        return hideOverlay(/* delay: */ 2500);
    } 

    loadImage(imageUrl)
        // May need to load the image through a proxy if the host doesn't support CORS.
        .catch(() => loadImage("https://skribbl-io-autodraw-cors-proxy.galehouse5.workers.dev?" + imageUrl))
        .then(drawImage)
        .catch(() => log(`Couldn't load image: ${imageUrl}. Sorry :(`));
};

listenForDragDropEvents(document, handleDragEnter, hideOverlay, handleDrop);
clearButton.addEventListener("click", stopDrawing);
canvasContainer.appendChild(overlay);
