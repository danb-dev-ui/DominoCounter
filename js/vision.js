//
// Domino Counter
// Version 0.5.6
// Adjustable Threshold
//

const THRESHOLD = 200;

export function analyzeImage(canvas) {

    const ctx = canvas.getContext("2d");

    const width = canvas.width;
    const height = canvas.height;

    const image = ctx.getImageData(
        0,
        0,
        width,
        height
    );

    const pixels = image.data;

    const binary = new Uint8Array(width * height);

    let brightPixels = 0;

    for (let y = 0; y < height; y++) {

        for (let x = 0; x < width; x++) {

            const index = y * width + x;

            const p = index * 4;

            const r = pixels[p];
            const g = pixels[p + 1];
            const b = pixels[p + 2];

            const brightness = (r + g + b) / 3;

            if (brightness >= THRESHOLD) {

                binary[index] = 1;

                brightPixels++;

            }

        }

    }

    //
    // Draw sampled pixels
    //

    ctx.fillStyle = "red";

    for (let y = 0; y < height; y += 4) {

        for (let x = 0; x < width; x += 4) {

            const index = y * width + x;

            if (binary[index]) {

                ctx.fillRect(x, y, 2, 2);

            }

        }

    }

    return {

        width,
        height,
        brightPixels,
        threshold: THRESHOLD,
        binary

    };

}