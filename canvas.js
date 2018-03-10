let createCanvas = function (document) {
    let element = document.getElementById("canvasGame");

    let getMouseCoords = function (canvasCoords) {
        var bounds = element.getBoundingClientRect();

        return {
            x: canvasCoords.x * bounds.width / 800 + bounds.x,
            y: canvasCoords.y * bounds.height / 600 + bounds.y
        };
    };

    let createMouseEvent = function (name, coords) {
        return new MouseEvent(name, {
            bubbles: true,
            clientX: coords.x,
            clientY: coords.y,
            button: 0 // Left click
        });
    };

    return {
        size: { width: 800, height: 600 },

        draw: function (coords) {
            let startMouseCoords = getMouseCoords(coords[0]);
            element.dispatchEvent(createMouseEvent("mousedown", startMouseCoords));

            for (let i = 1; i < coords.length; i++) {
                let mouseCoords = getMouseCoords(coords[i]);
                element.dispatchEvent(createMouseEvent("mousemove", mouseCoords));
            }

            let endMouseCoords = getMouseCoords(coords[coords.length - 1]);
            element.dispatchEvent(createMouseEvent("mouseup", endMouseCoords));
        }
    };
};
