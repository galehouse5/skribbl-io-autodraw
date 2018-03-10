let createToolbar = function (document) {
    let colorElements = document.querySelectorAll("[data-color]");
    let sizeElements = document.querySelectorAll("[data-size]");
    let toolElements = document.querySelectorAll("[data-tool]");
    let clearElement = document.getElementById("buttonClearCanvas");

    let toRgbObject = function (rgbString) {
        let parts = rgbString.substring(4, rgbString.length - 1).split(", ");
        return { r: parseInt(parts[0]), g: parseInt(parts[1]), b: parseInt(parts[2]) };
    };

    let toRgbString = function (rgbObject) {
        return `rgb(${rgbObject.r}, ${rgbObject.g}, ${rgbObject.b})`;
    };

    return {
        getColors: function () {
            return Array.prototype.slice.call(colorElements)
                .map(e => toRgbObject(e.style.backgroundColor));
        },

        setColor: function (color) {
            Array.prototype.slice.call(colorElements)
                .filter(e => e.style.backgroundColor === toRgbString(color))
                .forEach(e => e.click());
        },

        getPenDiameters: function () {
            return [4, 10, 20, 40];
        },

        setPenDiameter: function (diameter) {
            Array.prototype.slice.call(sizeElements)
                .filter(e => e.getAttribute("data-size") === "0" && diameter === 4
                    || e.getAttribute("data-size") === "0.15" && diameter === 10
                    || e.getAttribute("data-size") === "0.45" && diameter === 20
                    || e.getAttribute("data-size") === "1" && diameter === 40)
                .forEach(e => e.click());
        },

        clear: function () {
            clearElement.click();
        },

        setPenTool: function () {
            Array.prototype.slice.call(toolElements)
                .filter(e => e.getAttribute("data-tool") === "pen")
                .forEach(e => e.click());
        },

        setFillTool: function () {
            Array.prototype.slice.call(toolElements)
                .filter(e => e.getAttribute("data-tool") === "fill")
                .forEach(e => e.click());
        }
    };
};
