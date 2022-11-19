export default function (canvasElement) {
    const context = canvasElement.getContext('2d');

    let getMouseCoords = function (canvasCoords) {
        let bounds = canvasElement.getBoundingClientRect();

        return {
            x: canvasCoords.x * bounds.width / 800 + bounds.x,
            y: canvasCoords.y * bounds.height / 600 + bounds.y
        };
    };

    let createMouseEvent = function (name, coords) {
        return new PointerEvent(name, {
            pointerType: "mouse",
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
            canvasElement.dispatchEvent(createMouseEvent("pointerdown", startMouseCoords));

            for (let i = 1; i < coords.length; i++) {
                let mouseCoords = getMouseCoords(coords[i]);
                canvasElement.dispatchEvent(createMouseEvent("pointermove", mouseCoords));
            }

            let endMouseCoords = getMouseCoords(coords[coords.length - 1]);
            canvasElement.dispatchEvent(createMouseEvent("pointerup", endMouseCoords));
        }
    };
};
