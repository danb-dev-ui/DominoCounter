//
// Domino Counter
// Version 0.5.7
// White Object Detection
//

const MIN_BRIGHTNESS = 170;
const MAX_COLOR_DIFF = 35;

export function analyzeImage(canvas) {

    const ctx = canvas.getContext("2d");

    const width = canvas.width;
    const height = canvas.height;

    const image = ctx.getImageData(0, 0, width, height);

    const pixels = image.data;

    let whitePixels = 0;

    ctx.fillStyle = "red";

    for (let y = 0; y < height; y += 2) {

        for (let x = 0; x < width; x += 2) {

            const p = (y * width + x) * 4;

            const r = pixels[p];
            const g = pixels[p + 1];
            const b = pixels[p + 2];

            const brightness = (r + g + b) / 3;

            const colorSpread =
                Math.max(r, g, b) -
                Math.min(r, g, b);

            if (
                brightness > MIN_BRIGHTNESS &&
                colorSpread < MAX_COLOR_DIFF
            ) {

                ctx.fillRect(x, y, 2, 2);

                whitePixels++;

            }

        }

    }

    return {

        whitePixels

    };

}