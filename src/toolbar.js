const toRgbObject = function (rgbString) {
    let parts = rgbString.substring(4, rgbString.length - 1).split(", ");
    return { r: parseInt(parts[0]), g: parseInt(parts[1]), b: parseInt(parts[2]) };
};

const toRgbString = function (rgbObject) {
    return `rgb(${rgbObject.r}, ${rgbObject.g}, ${rgbObject.b})`;
};

export default function (toolbarElement) {
    let colorElements = Array.prototype.slice.call(toolbarElement.querySelectorAll(".colorItem"));
    let colors = colorElements.map(e => toRgbObject(e.style.backgroundColor));
    let colorElementsLookup = new Map(colorElements.map(e => [ e.style.backgroundColor, e ]));

    let sizeElements = Array.prototype.slice.call(toolbarElement.querySelectorAll(".brushSize"));
    let sizeElementsLookup = {
        // Not 3 because it creates blank horizontal lines about every 50 vertical pixels.
        2.9: sizeElements.find(e => e.getAttribute("data-size") === "0"),
        7: sizeElements.find(e => e.getAttribute("data-size") === "0.15"),
        19: sizeElements.find(e => e.getAttribute("data-size") === "0.45"),
        39: sizeElements.find(e => e.getAttribute("data-size") === "1"),
    };

    let clearElement = toolbarElement.querySelector("#buttonClearCanvas");

    let toolElements = Array.prototype.slice.call(toolbarElement.querySelectorAll("[data-tool]"));
    let penToolElement = toolElements.find(e => e.getAttribute("data-tool") === "pen");
    let fillToolElement = toolElements.find(e => e.getAttribute("data-tool") === "fill");

    return {
        getColors: () => colors,
        setColor: color => {
            let rgbString = toRgbString(color);
            colorElementsLookup.get(rgbString).click();
        },
        getPenDiameters: () => [2.9, 7, 19, 39],
        setPenDiameter: diameter => { sizeElementsLookup[diameter].click(); },
        clear: () => { clearElement.click(); },
        setPenTool: () => { penToolElement.click(); },
        setFillTool: () => { fillToolElement.click(); },
        isEnabled: () => toolbarElement.style.display !== "none"
    };
};
