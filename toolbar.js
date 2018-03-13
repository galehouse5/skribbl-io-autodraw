let createToolbar = function (document) {
    let toRgbObject = function (rgbString) {
        let parts = rgbString.substring(4, rgbString.length - 1).split(", ");
        return { r: parseInt(parts[0]), g: parseInt(parts[1]), b: parseInt(parts[2]) };
    };

    let toRgbString = function (rgbObject) {
        return `rgb(${rgbObject.r}, ${rgbObject.g}, ${rgbObject.b})`;
    };

    let colorElements = Array.prototype.slice.call(document.querySelectorAll("[data-color]"));
    let colors = colorElements.map(e => toRgbObject(e.style.backgroundColor));
    let colorElementsLookup = new Map(colorElements.map(e => [ e.style.backgroundColor, e ]));

    let sizeElements = Array.prototype.slice.call(document.querySelectorAll("[data-size]"));
    let sizeElementsLookup = {
        4: sizeElements.filter(e => e.getAttribute("data-size") === "0")[0],
        10: sizeElements.filter(e => e.getAttribute("data-size") === "0.15")[0],
        20: sizeElements.filter(e => e.getAttribute("data-size") === "0.45")[0],
        40: sizeElements.filter(e => e.getAttribute("data-size") === "1")[0],
    };

    let clearElement = document.getElementById("buttonClearCanvas");

    let toolElements = Array.prototype.slice.call(document.querySelectorAll("[data-tool]"));
    let penToolElement = toolElements.filter(e => e.getAttribute("data-tool") === "pen")[0];
    let fillToolElement = toolElements.filter(e => e.getAttribute("data-tool") === "fill")[0];

    return {
        getColors: () => colors,
        setColor: color => {
            let rgbString = toRgbString(color);
            colorElementsLookup.get(rgbString).click();
        },
        getPenDiameters: () => [4, 10, 20, 40],
        setPenDiameter: diameter => { sizeElementsLookup[diameter].click(); },
        clear: () => { clearElement.click(); },
        setPenTool: () => { penToolElement.click(); },
        setFillTool: () => { fillToolElement.click(); }
    };
};
