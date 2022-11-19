export default function (document) {
    const overlay = document.createElement("div");
    overlay.id = "autoDrawOverlay";
    document.getElementById('game-canvas').appendChild(overlay);

    return {
        getCanvasContainerElement: () => document.getElementById('game-canvas'),
        getCanvasElement: () => document.querySelector('#game-canvas canvas'),
        getColorElements: () => document.querySelectorAll('#game-toolbar .colors .color'),
        getSizeElements: () => document.querySelectorAll('#game-toolbar .sizes .size'),
        getClearToolElement: () => document.querySelector('#game-toolbar .tool[data-tooltip="Clear"]'),
        getPenToolElement: () => document.querySelector('#game-toolbar .tool[data-tooltip="Brush"]'),
        getFillToolElement: () => document.querySelector('#game-toolbar .tool[data-tooltip="Fill"]'),
        getToolbarElement: () => document.getElementById('game-toolbar'),

        hideCanvasOverlay: delay => setTimeout(function () {
            document.body.classList.remove("showingAutodrawOverlay");
            }, delay || 0),

        showCanvasOverlay: text => {
            overlay.innerText = text;
            document.body.classList.add("showingAutodrawOverlay");
        }
    };
};
