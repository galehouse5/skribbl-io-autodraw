import createCanvas from "./canvas";
import createToolbar from "./toolbar";
import createArtist from "./artist";
import { getImgFileUrl, getImgElementSrc } from "./data-transfer-helper";
import { loadImage } from "./image-helper";
import log from "./log";
import processWithoutBlocking from "./non-blocking-processor";
import listenForDragDropEvents from "./drag-drop-event-listener";
import createDomHelper from "./dom-helper";

const domHelper = createDomHelper(document);
const clearToolElement = domHelper.getClearToolElement();
const canvas = createCanvas(domHelper.getCanvasElement());
const toolbar = createToolbar(domHelper);
const artist = createArtist(canvas, toolbar);

let commands = [];

const handleDragEnter = function () {
    if (!toolbar.isEnabled()) return;
    domHelper.showCanvasOverlay("Drop image here to auto draw!");
};

const drawImage = function (image) {
    log("Clearing canvas...");
    toolbar.clear();

    log(`Drawing ${image.width} x ${image.height} image...`);
    commands = commands.concat(artist.draw(image));
    domHelper.hideCanvasOverlay();
    processWithoutBlocking(commands, /* shouldStop: */ () => !toolbar.isEnabled());
};

const stopDrawing = function () {
    if (!commands.length) return;

    log("Clearing commands...");
    commands.length = 0;
    log("Drawing stopped.");
};

const handleDrop = function (event) {
    event.preventDefault();

    if (!domHelper.getCanvasContainerElement().contains(event.target))
        return domHelper.hideCanvasOverlay();

    if (!toolbar.isEnabled()) {
        log("Can't draw right now.");
        return domHelper.hideCanvasOverlay();
    } 

    log("Processing dropped content...");
    domHelper.showCanvasOverlay("Auto draw is loading image...");
    const imageUrl = getImgFileUrl(event.dataTransfer)
        || getImgElementSrc(event.dataTransfer);
    if (!imageUrl) {
        domHelper.showCanvasOverlay("Auto draw couldn't load image :(");
        log("Dropped content not recognized.");
        return domHelper.hideCanvasOverlay(/* delay: */ 2500);
    } 

    loadImage(imageUrl)
        // May need to load the image through a proxy if the host doesn't support CORS.
        .catch(() => loadImage("https://skribbl-io-autodraw-cors-proxy.galehouse5.workers.dev?" + imageUrl))
        .then(drawImage)
        .catch(() => log(`Couldn't load image: ${imageUrl}. Sorry :(`));
};

listenForDragDropEvents(document, handleDragEnter, domHelper.hideCanvasOverlay, handleDrop);
clearToolElement.addEventListener("click", stopDrawing);
