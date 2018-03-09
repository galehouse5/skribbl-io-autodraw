let createArtist = function (canvas, toolbar) {	
    // Taken from: https://www.compuphase.com/cmetric.htm
    let getColorDistance = function (color1, color2) {
        let rmean = (color1.r + color2.r) / 2;
        let r = color1.r - color2.r;
        let g = color1.g - color2.g;
        let b = color1.b - color2.b;
        return Math.sqrt((((512 + rmean) * r * r) >> 8) + 4 * g * g + (((767 - rmean) * b * b) >> 8));
    };
    
    let getClosestToolbarColor = function (target) {
        let minDistance = Number.MAX_VALUE;
        let closestColor = null;

        for (let color of toolbar.getColors()) {
            let distance = getColorDistance(target, color);
            if (distance >= minDistance) continue;
            
            minDistance = distance;
            closestColor = color;
        }

        return closestColor;
    };

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
            let color = getClosestToolbarColor(imageData.getRgbObject({ x, y }));
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
        
        // Draw vertical lines.
        for (let x = 0; x < imageData.width; x++) {
            commands = commands.concat(
                drawLine(imageData, diameter, function (iterate) {
                    for (let y = 0; y < imageData.height; y++) {
                        iterate(x, y);
                    }
                })
            );
        }

        // Draw horizontal lines.
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

            commands.push(function () {
                toolbar.clear();
            });

            for (let diameter of toolbar.getPenDiameters()) {
                let effectiveResolution = {
                    width: canvas.size.width / diameter,
                    height: canvas.size.height / diameter
                };
                let imageData = imageHelper.fitImageData(effectiveResolution);
                let commands2 = draw(imageData, diameter);
                
                // Randomize commands.
                commands2.sort(function () { return 0.5 - Math.random(); });
                commands = commands.concat(commands2);
            }

            return commands;
        }
    };
};
