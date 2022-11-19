const toRgbObject = function (rgbString) {
    let parts = rgbString.substring(4, rgbString.length - 1).split(", ");
    return { r: parseInt(parts[0]), g: parseInt(parts[1]), b: parseInt(parts[2]) };
};

const toRgbString = function (rgbObject) {
    return `rgb(${rgbObject.r}, ${rgbObject.g}, ${rgbObject.b})`;
};

export default function (domHelper) {
    let colorElements = Array.prototype.slice.call(domHelper.getColorElements());
    let colors = colorElements.map(e => toRgbObject(e.style.backgroundColor));
    let colorElementsLookup = new Map(colorElements.map(e => [ e.style.backgroundColor, e ]));

    let sizeElements = domHelper.getSizeElements();
    let sizeElementsLookup = {
        4: sizeElements[0],
        10: sizeElements[1],
        20: sizeElements[2],
        32: sizeElements[3],
        40: sizeElements[4],
    };

    return {
        getColors: () => colors,
        setColor: color => {
            let rgbString = toRgbString(color);
            colorElementsLookup.get(rgbString).click();
        },
        getPenDiameters: () => [4, 10, 20, 32, 40],
        setPenDiameter: diameter => { sizeElementsLookup[diameter].click(); },
        clear: () => { domHelper.getClearToolElement().click(); },
        setPenTool: () => { domHelper.getPenToolElement().click(); },
        setFillTool: () => { domHelper.getFillToolElement().click(); },
        isEnabled: () => domHelper.getToolbarElement().style.display !== "none"
    };
};
