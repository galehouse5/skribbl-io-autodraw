export function getImgFileUrl(dataTransfer) {
    if (!dataTransfer.files.length) return null;

    let file = dataTransfer.files[0];
    if (!file.type.startsWith("image/")) return null;

    return URL.createObjectURL(dataTransfer.files[0]);
};

export function getImgElementSrc(dataTransfer) {
    let html = dataTransfer.getData("text/html");
    if (!html) return null;

    let container = document.createElement("div");
    container.innerHTML = html;

    let element = container.firstChild;
    if (!element || !/^img$/i.test(element.tagName)) return null;

    return element.getAttribute("src");
}
