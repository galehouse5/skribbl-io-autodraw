let createArtist = function (canvas, toolbar, colorHelper) {
    let drawLine = function (imageData, diameter, iterator) {
        let commands = [];
        let lineColor = null;
        let lineStartCoords = null;
        let lineEndCoords = null;

        let drawAndEnd = function () {
            let color = lineColor;
            let coords = [lineStartCoords, lineEndCoords];

            commands.push(function () {
                toolbar.setPenTool();
                toolbar.setColor(color);
                toolbar.setPenDiameter(diameter);
                canvas.draw(coords);
            });

            lineColor = null;
            lineStartCoords = null;
            lineEndCoords = null;
        };

        let shouldExtend = function (color) {
            return color.r === lineColor.r
                && color.g === lineColor.g
                && color.b === lineColor.b;
        };

        let startOrExtend = function (coords) {
            lineStartCoords = lineStartCoords || coords;
            lineEndCoords = coords;
        };

        iterator(function (x, y) {
            let color = colorHelper.getClosestColor(
                imageData.getRgbObject({ x, y }), toolbar.getColors());
            lineColor = lineColor || color;

            let coords = { x: diameter / 2 + x * diameter, y: diameter / 2 + y * diameter };

            if (shouldExtend(color)) {
                startOrExtend(coords);
                return;
            };

            drawAndEnd();
            startOrExtend(coords);
        });

        if (lineColor) {
            drawAndEnd();
        }

        return commands;
    };

    let draw = function (imageData, diameter) {
        let commands = [];

        // Vertical lines
        for (let x = 0; x < imageData.width; x++) {
            commands = commands.concat(
                drawLine(imageData, diameter, function (iterate) {
                    for (let y = 0; y < imageData.height; y++) {
                        iterate(x, y);
                    }
                })
            );
        }

        // Horizontal lines
        for (let y = 0; y < imageData.height; y++) {
            commands = commands.concat(
                drawLine(imageData, diameter, function (iterate) {
                    for (let x = 0; x < imageData.width; x++) {
                        iterate(x, y);
                    }
                })
            );
        }

        return commands;
    };

    return {
        draw: function (imageHelper) {
            let commands = [];

            for (let diameter of toolbar.getPenDiameters()
                .filter(d => d > 4) // Diameter 4 generates too many draw commands. Disable it until drawing is more efficient.
                .sort().reverse()) {
                let effectiveResolution = {
                    width: canvas.size.width / diameter,
                    height: canvas.size.height / diameter
                };
                let imageData = imageHelper.fitImageData(effectiveResolution,
                     /* backgroundColor */ { r: 255, g: 255, b: 255 });

                log(`Generating draw commands for ${diameter}px pen...`);
                let commands2 = draw(imageData, diameter);
                log(`${commands2.length} commands generated.`);

                // Randomize commands.
                commands2.sort(function () { return 0.5 - Math.random(); });
                commands = commands.concat(commands2);
            }

            return commands;
        }
    };
};
