import createCanvas from "./canvas";
import createToolbar from "./toolbar";
import createArtist from "./artist";
import { getImgFileUrl, getImgElementSrc } from "./data-transfer-helper";
import { loadImage } from "./image-helper";
import log from "./log";
import processWithoutBlocking from "./non-blocking-processor";
import listenForDragEvents from "./drag-event-listener";

const canvasContainer = document.getElementById("containerCanvas");
const clearButton = document.getElementById("buttonClearCanvas");
const canvas = createCanvas(document.getElementById("canvasGame"));
const toolbar = createToolbar(document.querySelector(".containerToolbar"));
const artist = createArtist(canvas, toolbar);

let commands = [];

const handleDragEnter = function () {
    if (!toolbar.isEnabled()) return;

    document.body.classList.add("dragging");
};

const handleDragLeave = function () {
    document.body.classList.remove("dragging");
};

const drawImage = function (image) {
    log("Clearing canvas...");
    toolbar.clear();

    // The clear command is processed after a ~100ms delay. Some of our drawing will be cleared unless we wait.
    setTimeout(function () {
        log(`Drawing ${image.width} x ${image.height} image...`);
        commands = commands.concat(artist.draw(image));
        processWithoutBlocking(commands, 10,
            /* shouldStop: */() => !toolbar.isEnabled());
    }, 150);
};

const stopDrawing = function () {
    if (!commands.length) return;

    log("Clearing commands...");
    commands.length = 0;
    log("Drawing stopped.");
};

const handleDrop = function (event) {
    event.preventDefault();

    if (!canvasContainer.contains(event.target)) return;
    if (!toolbar.isEnabled()) return log("Can't draw right now.");

    log("Processing dropped content...");
    const imageUrl = getImgFileUrl(event.dataTransfer)
        || getImgElementSrc(event.dataTransfer);
    if (!imageUrl) return log("Dropped content not recognized.");

    loadImage(imageUrl)
        // May need to load the image through a proxy if the host doesn't support CORS.
        .catch(() => loadImage("https://yacdn.org/serve/" + imageUrl))
        .catch(() => loadImage("https://cors-anywhere.herokuapp.com/" + imageUrl))
        .then(drawImage)
        .catch(() => log(`Couldn't load image: ${imageUrl}. Sorry :(`));
};

const initializeOverlay = function () {
    log("Initializing overlay...");
    const overlay = document.createElement("div");
    overlay.id = "autoDrawOverlay";
    overlay.innerText = "Drop image here to auto draw!";
    canvasContainer.appendChild(overlay);
};

listenForDragEvents(document, handleDragEnter, handleDragLeave);
document.body.addEventListener("drop", handleDrop);
clearButton.addEventListener("click", stopDrawing);
initializeOverlay();
