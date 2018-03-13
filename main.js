log("Initializing overlay...");
let overlay = document.createElement("p");
overlay.id = "autoDrawOverlay";
overlay.innerText = "Drag and drop an image here to auto draw!";

let canvasContainer = document.getElementById("containerCanvas");
canvasContainer.appendChild(overlay);

let onDragOver = function (event) {
    canvasContainer.classList.add("showAutoDrawOverlay");
    // MDN: If you want to allow a drop, you must prevent the default handling by cancelling the event. 
    event.preventDefault();
};

let onDragLeave = function () {
    canvasContainer.classList.remove("showAutoDrawOverlay");
};

let getImgFileUrl = function (dataTransfer) {
    if (!dataTransfer.files.length) return null;

    var file = dataTransfer.files[0];
    if (!file.type.startsWith("image/")) {
        log("Dropped file isn't an image.")
        return null;
    }

    return URL.createObjectURL(dataTransfer.files[0]);
};

let getImgElementSrc = function (dataTransfer) {
    let html = dataTransfer.getData("text/html");
    if (!html) return null;

    var container = document.createElement("div");
    container.innerHTML = html;

    var element = container.firstChild;
    if (!element || !/^img$/i.test(element.tagName)) {
        log("Dropped element isn't an image.");
        return null;
    }

    return element.getAttribute("src");
};

let canvas = createCanvas(document);
let toolbar = createToolbar(document);
let artist = createArtist(canvas, toolbar, colorHelper);

let onDrop = function (event) {
    log("Processing dropped content...");
    canvasContainer.classList.remove("showAutoDrawOverlay");
    event.preventDefault();

    let imageUrl = getImgFileUrl(event.dataTransfer)
        || getImgElementSrc(event.dataTransfer);
    if (!imageUrl) {
        log("Dropped content not recognized.");
        return;
    };

    let image = new Image;

    image.onload = function () {
        log(`Drawing ${image.width} x ${image.height} image...`);
        let helper = createImageHelper(image);
        let commands = artist.draw(helper);
        processWithoutBlocking(commands, 10);
    };

    image.onerror = function () {
        log("Error loading image.");
    };

    log(`Loading image: ${imageUrl}...`);
    // CORS prohibits pixel access to images from a different origin.
    image.crossOrigin = "Anonymous";
    image.src = imageUrl.startsWith("http") ? ("https://cors-anywhere.herokuapp.com/" + imageUrl) : imageUrl;
};

canvasContainer.addEventListener("dragover", onDragOver);
canvasContainer.addEventListener("dragleave", onDragLeave);
canvasContainer.addEventListener("drop", onDrop);
