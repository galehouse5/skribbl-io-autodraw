let dataTransferHelper = {
    getImgFileUrl: function (dataTransfer) {
        if (!dataTransfer.files.length) return null;
    
        let file = dataTransfer.files[0];
        if (!file.type.startsWith("image/")) {
            log("Dropped file isn't an image.")
            return null;
        }
    
        return URL.createObjectURL(dataTransfer.files[0]);
    },

    getImgElementSrc: function (dataTransfer) {
        let html = dataTransfer.getData("text/html");
        if (!html) return null;
    
        let container = document.createElement("div");
        container.innerHTML = html;
    
        let element = container.firstChild;
        if (!element || !/^img$/i.test(element.tagName)) {
            log("Dropped element isn't an image.");
            return null;
        }
    
        return element.getAttribute("src");
    }
};
