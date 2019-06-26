import { getDataUrl } from "./image-helper";
import log from "./log";

const loadImageDataUrl = function (url, callback) {
    const image = new Image;
    image.onload = () => callback(getDataUrl(image));
    image.onerror = () => log("Error loading image.");
    image.src = url;
};

const handleMessage = function (message, sender, sendResponse) {
    if (message.contentScriptQuery == "loadImageDataUrl") {
        loadImageDataUrl(message.url, sendResponse);
        return true;
    }

    throw "Not supported.";
};

chrome.runtime.onMessage.addListener(handleMessage);
