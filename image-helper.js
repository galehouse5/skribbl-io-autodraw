let createImageHelper = function (img) {
    let createCanvas = function (canvasSize) {
        let canvas = document.createElement("canvas");
        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;
        return canvas;
    };
    
    let fill = function (canvas, context) {
        let factor = Math.max(canvas.width / img.width, canvas.height / img.height);
        
        let dw = factor * img.width;
        let dh = factor * img.height;
    
        let dx = (canvas.width - dw) / 2;
        let dy = (canvas.height - dh) / 2;
        
        context.drawImage(img, dx, dy, dw, dh);
    };
    
    let fit = function (canvas, context) {
        let factor = Math.min(canvas.width / img.width, canvas.height / img.height);
        
        let dw = factor * img.width;
        let dh = factor * img.height;
    
        let dx = (canvas.width - dw) / 2;
        let dy = (canvas.height - dh) / 2;
        
        context.drawImage(img, dx, dy, dw, dh);
    };
    
    let getImageData = function (canvas, context) {
        let imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        imageData.getRgbObject = function (coords) {
            return {
                r: this.data[4 * (coords.x + coords.y * this.width) + 0],
                g: this.data[4 * (coords.x + coords.y * this.width) + 1],
                b: this.data[4 * (coords.x + coords.y * this.width) + 2]
            };
        };
        
        return imageData;
    };
    
    return {
        fillImageData: function (size) {
            let canvas = createCanvas(size);
            let context = canvas.getContext("2d");
            fill(canvas, context);
            return getImageData(canvas, context);
        },
        
        fitImageData: function (size) {
            let canvas = createCanvas(size);
            let context = canvas.getContext("2d");
            fit(canvas, context);
            return getImageData(canvas, context);
        }
    };
};
